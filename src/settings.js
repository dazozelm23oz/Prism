/**
 * Settings Component: Themes, customization, persistence, and backup triggers
 */

export const THEMES = {
  "Nord": {
    "--bg": "#2e3440",
    "--bg-panel": "#3b4252",
    "--bg-card": "#434c5e",
    "--fg": "#eceff4",
    "--fg-dim": "#d8dee9",
    "--accent": "#88c0d0",
    "--border": "#4c566a",
    "--grid": "rgba(236, 239, 244, 0.08)",
    "--axis": "rgba(236, 239, 244, 0.4)",
  },
  "Desmos-like dark": {
    "--bg": "#141619",
    "--bg-panel": "#1f2227",
    "--bg-card": "#2a2e35",
    "--fg": "#f0f2f5",
    "--fg-dim": "#a0a6b2",
    "--accent": "#2f80ed",
    "--border": "#373d47",
    "--grid": "rgba(240, 242, 245, 0.07)",
    "--axis": "rgba(240, 242, 245, 0.4)",
  },
  "Desmos-like light": {
    "--bg": "#ffffff",
    "--bg-panel": "#f7f9fa",
    "--bg-card": "#ffffff",
    "--fg": "#22252a",
    "--fg-dim": "#5c6370",
    "--accent": "#2f80ed",
    "--border": "#e1e4e8",
    "--grid": "rgba(0, 0, 0, 0.08)",
    "--axis": "rgba(0, 0, 0, 0.45)",
  },
  "Gruvbox": {
    "--bg": "#282828",
    "--bg-panel": "#3c3836",
    "--bg-card": "#504945",
    "--fg": "#ebdbb2",
    "--fg-dim": "#a89984",
    "--accent": "#fabd2f",
    "--border": "#665c54",
    "--grid": "rgba(235, 219, 178, 0.08)",
    "--axis": "rgba(235, 219, 178, 0.4)",
  },
  "Solarized": {
    "--bg": "#002b36",
    "--bg-panel": "#073642",
    "--bg-card": "#094553",
    "--fg": "#93a1a1",
    "--fg-dim": "#657b83",
    "--accent": "#2aa198",
    "--border": "#586e75",
    "--grid": "rgba(147, 161, 161, 0.08)",
    "--axis": "rgba(147, 161, 161, 0.4)",
  },
  "Catppuccin": {
    "--bg": "#1e1e2e",
    "--bg-panel": "#252538",
    "--bg-card": "#313244",
    "--fg": "#cdd6f4",
    "--fg-dim": "#a6adc8",
    "--accent": "#89b4fa",
    "--border": "#45475a",
    "--grid": "rgba(205, 214, 244, 0.08)",
    "--axis": "rgba(205, 214, 244, 0.4)",
  },
  "KDE Breeze dark": {
    "--bg": "#232629",
    "--bg-panel": "#2a2e32",
    "--bg-card": "#31363b",
    "--fg": "#eff0f1",
    "--fg-dim": "#bdc3c7",
    "--accent": "#3daee9",
    "--border": "#474d53",
    "--grid": "rgba(239, 240, 241, 0.08)",
    "--axis": "rgba(239, 240, 241, 0.4)",
  },
  "KDE Breeze light": {
    "--bg": "#eff0f1",
    "--bg-panel": "#fcfcfc",
    "--bg-card": "#ffffff",
    "--fg": "#232629",
    "--fg-dim": "#7f8c8d",
    "--accent": "#3daee9",
    "--border": "#bdc3c7",
    "--grid": "rgba(35, 38, 41, 0.08)",
    "--axis": "rgba(35, 38, 41, 0.45)",
  },
};

export class SettingsManager {
  constructor(containerEl, onThemeChange, onBackupNow) {
    this.container = containerEl;
    this.onThemeChange = onThemeChange;
    this.onBackupNow = onBackupNow;

    this.settings = this.loadSettings();
    this.initDOM();
    this.applyTheme(this.settings.theme);
  }

  loadSettings() {
    const saved = localStorage.getItem("prism_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      theme: "Nord",
      followSystem: false,
      fontSize: 16,
      gridOpacity: 0.1,
      showGrid: true,
      showAxes: true,
      pdfTheme: "Current Theme",
    };
  }

  saveSettings() {
    localStorage.setItem("prism_settings", JSON.stringify(this.settings));
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="settings-form">
        <h3>Appearance & Themes</h3>
        <div class="settings-row">
          <label>Theme Preset:</label>
          <select id="setting-theme-select" class="dropdown-select">
            ${Object.keys(THEMES).map(t => `<option value="${t}" ${this.settings.theme === t ? 'selected' : ''}>${t}</option>`).join("")}
          </select>
        </div>

        <div class="settings-row">
          <label>PDF Export Theme:</label>
          <select id="setting-pdf-theme" class="dropdown-select">
            <option value="Current Theme">Current App Theme</option>
            <option value="Print Light">High-Contrast Print Light</option>
          </select>
        </div>

        <div class="settings-row">
          <label>Base Font Size (px):</label>
          <input type="range" id="setting-font-size" min="13" max="22" value="${this.settings.fontSize}">
          <span id="font-size-val">${this.settings.fontSize}px</span>
        </div>

        <h3 style="margin-top: 24px;">Graph Display Defaults</h3>
        <div class="settings-row">
          <label>Show Grid:</label>
          <input type="checkbox" id="setting-show-grid" ${this.settings.showGrid ? 'checked' : ''}>
        </div>
        <div class="settings-row">
          <label>Show Axes:</label>
          <input type="checkbox" id="setting-show-axes" ${this.settings.showAxes ? 'checked' : ''}>
        </div>

        <h3 style="margin-top: 24px;">Backup & Recovery</h3>
        <div class="settings-row">
          <p style="font-size: 0.9rem; color: var(--fg-dim); margin-bottom: 8px;">
            Dual destination backup: creates a snapshot in <code>/mnt/StudyBackups/MathCalc/</code> and commits to git.
          </p>
        </div>
        <div>
          <button class="action-btn primary" id="btn-settings-backup">&#128190; Back up now</button>
          <span id="backup-status-toast" style="margin-left: 12px; font-size: 0.9rem;"></span>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const themeSelect = this.container.querySelector("#setting-theme-select");
    themeSelect.addEventListener("change", (e) => {
      this.settings.theme = e.target.value;
      this.saveSettings();
      this.applyTheme(this.settings.theme);
    });

    const fontSlider = this.container.querySelector("#setting-font-size");
    fontSlider.addEventListener("input", (e) => {
      this.settings.fontSize = parseInt(e.target.value, 10);
      this.container.querySelector("#font-size-val").textContent = `${this.settings.fontSize}px`;
      document.documentElement.style.fontSize = `${this.settings.fontSize}px`;
      this.saveSettings();
    });

    const backupBtn = this.container.querySelector("#btn-settings-backup");
    backupBtn.addEventListener("click", async () => {
      const toast = this.container.querySelector("#backup-status-toast");
      toast.textContent = "Backing up...";
      toast.style.color = "var(--accent)";
      if (this.onBackupNow) {
        try {
          const res = await this.onBackupNow("Manual backup via Settings");
          toast.textContent = `✓ Saved to ${res.backup_dir.split('/').pop()}`;
          toast.style.color = "#a6e3a1";
        } catch (err) {
          toast.textContent = `✗ Backup failed: ${err}`;
          toast.style.color = "#f38ba8";
        }
      }
    });
  }

  applyTheme(themeName) {
    const tokens = THEMES[themeName] || THEMES["Nord"];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value);
    }
    if (this.onThemeChange) {
      this.onThemeChange(themeName, tokens);
    }
  }

  getCurrentThemeTokens() {
    return THEMES[this.settings.theme] || THEMES["Nord"];
  }
}
