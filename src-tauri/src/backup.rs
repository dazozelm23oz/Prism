use chrono::{Datelike, Local, Timelike};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupResult {
    pub success: bool,
    pub backup_dir: String,
    pub timestamp: String,
    pub commit_hash: String,
    pub push_status: String,
    pub message: String,
}

pub fn execute_backup(summary: &str) -> Result<BackupResult, String> {
    let base_backup_root = Path::new("/mnt/StudyBackups/MathCalc");
    let repo_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let repo_root = if repo_root.ends_with("src-tauri") {
        repo_root.parent().unwrap_or(&repo_root).to_path_buf()
    } else {
        repo_root
    };

    if !base_backup_root.exists() {
        let err_msg = "Backup destination /mnt/StudyBackups/MathCalc does not exist".to_string();
        log_to_backup_doc(&repo_root, false, "", "", &err_msg);
        return Err(err_msg);
    }

    let now = Local::now();
    let hour = now.hour();
    let am_pm = if hour < 12 { "AM" } else { "PM" };
    // Format: DD-MM-YY-HH-MM-SS-AM/PM (with 24-hour hour value and AM/PM suffix as requested)
    let ts_folder = format!(
        "{:02}-{:02}-{:02}-{:02}-{:02}-{:02}-{}",
        now.day(),
        now.month(),
        now.year() % 100,
        hour,
        now.minute(),
        now.second(),
        am_pm
    );

    let mut dest_dir = base_backup_root.join(format!("Math-calc-{}", ts_folder));
    let mut suffix = 2;
    while dest_dir.exists() {
        dest_dir = base_backup_root.join(format!("Math-calc-{}-{}", ts_folder, suffix));
        suffix += 1;
    }

    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Failed to create backup dir {:?}: {:?}", dest_dir, e))?;

    // Determine repo root (parent of src-tauri or current working dir)
    let repo_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let repo_root = if repo_root.ends_with("src-tauri") {
        repo_root.parent().unwrap_or(&repo_root).to_path_buf()
    } else {
        repo_root
    };

    // 1. Copy required files and directories
    copy_directory_recursive(&repo_root.join("src"), &dest_dir.join("src"))?;
    copy_directory_recursive(&repo_root.join("src-tauri"), &dest_dir.join("src-tauri"))?;
    if repo_root.join("docs").exists() {
        copy_directory_recursive(&repo_root.join("docs"), &dest_dir.join("docs"))?;
    }

    let package_json = repo_root.join("package.json");
    if package_json.exists() {
        let _ = fs::copy(&package_json, dest_dir.join("package.json"));
    }
    let tauri_conf = repo_root.join("src-tauri/tauri.conf.json");
    if tauri_conf.exists() {
        let _ = fs::copy(&tauri_conf, dest_dir.join("tauri.conf.json"));
    }
    let cargo_toml = repo_root.join("src-tauri/Cargo.toml");
    if cargo_toml.exists() {
        let _ = fs::copy(&cargo_toml, dest_dir.join("Cargo.toml"));
    }

    // 2. Git commit
    let branch_output = Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(&repo_root)
        .output();
    let branch = branch_output
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "main".to_string());

    let commit_msg = format!("backup: {} — {}", ts_folder, summary);
    let _ = Command::new("git")
        .args(["add", "-A"])
        .current_dir(&repo_root)
        .output();
    let _ = Command::new("git")
        .args(["commit", "-m", &commit_msg])
        .current_dir(&repo_root)
        .output();

    let commit_output = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .current_dir(&repo_root)
        .output();
    let commit_hash = commit_output
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    // 3. Write BUILD_INFO.txt
    let build_info_content = format!(
        "Timestamp: {}\nGit Commit: {}\nActive Branch: {}\nSummary: {}\n",
        now.to_rfc3339(),
        commit_hash,
        branch,
        summary
    );
    let _ = fs::write(dest_dir.join("BUILD_INFO.txt"), &build_info_content);

    // 4. Git push
    let push_output = Command::new("git")
        .args(["push"])
        .current_dir(&repo_root)
        .output();

    let mut push_status = "Success".to_string();
    if let Ok(push_res) = push_output {
        if !push_res.status.success() {
            let stderr_str = String::from_utf8_lossy(&push_res.stderr);
            let push_err = format!("Git push failed: {}", stderr_str.trim());
            push_status = push_err.clone();
            let _ = fs::write(dest_dir.join("PUSH_ERROR.txt"), &push_err);
        }
    } else {
        let push_err = "Git push command failed to execute".to_string();
        push_status = push_err.clone();
        let _ = fs::write(dest_dir.join("PUSH_ERROR.txt"), &push_err);
    }

    log_to_backup_doc(
        &repo_root,
        true,
        &dest_dir.to_string_lossy(),
        &commit_hash,
        &format!("Summary: {} | Push: {}", summary, push_status),
    );

    Ok(BackupResult {
        success: true,
        backup_dir: dest_dir.to_string_lossy().to_string(),
        timestamp: ts_folder,
        commit_hash,
        push_status,
        message: format!("Backup completed successfully at {}", dest_dir.display()),
    })
}

fn copy_directory_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    if !src.exists() {
        return Ok(());
    }
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    for entry in walkdir::WalkDir::new(src)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            name != "target" && name != "node_modules" && name != ".git"
        })
        .filter_map(|e| e.ok())
    {
        let rel_path = entry
            .path()
            .strip_prefix(src)
            .map_err(|e| e.to_string())?;
        let target = dst.join(rel_path);
        if entry.file_type().is_dir() {
            fs::create_dir_all(&target).map_err(|e| e.to_string())?;
        } else if entry.file_type().is_file() {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            fs::copy(entry.path(), &target).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn log_to_backup_doc(repo_root: &Path, success: bool, dir: &str, commit: &str, notes: &str) {
    let doc_path = repo_root.join("docs/BACKUP_LOG.md");
    if let Some(parent) = doc_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let status_str = if success { "SUCCESS" } else { "FAILURE" };
    let entry = format!(
        "- **[{}]** `{}` | Commit: `{}` | Dir: `{}` | {}\n",
        status_str,
        Local::now().format("%Y-%m-%d %H:%M:%S"),
        commit,
        dir,
        notes
    );
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(doc_path) {
        let _ = file.write_all(entry.as_bytes());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backup_execution() {
        let res = execute_backup("Unit test verification backup");
        assert!(res.is_ok(), "Backup failed: {:?}", res.err());
        let info = res.unwrap();
        assert!(info.success);
        assert!(Path::new(&info.backup_dir).exists());
        assert!(Path::new(&info.backup_dir).join("BUILD_INFO.txt").exists());
    }
}
