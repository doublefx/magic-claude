#!/usr/bin/env node
/**
 * Cross-platform notification script for Claude Code hooks
 * Works on Linux, macOS, and Windows without external dependencies
 */

const { execSync, spawn } = require('child_process');
const os = require('os');

// Read from stdin (hook input)
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const title = 'Claude Code';
    let message = 'Waiting for input';

    // Customize message based on notification type
    const notificationType = input.notification_type;
    if (notificationType === 'permission_prompt') {
      message = 'Permission required - check terminal';
    } else if (notificationType === 'idle_prompt') {
      message = 'Claude is waiting for your input';
    } else if (notificationType === 'auth_success') {
      message = 'Authentication successful';
    }

    sendNotification(title, message);

    // Pass through input unchanged
    console.log(data);
  } catch (error) {
    // Don't fail the hook on notification error
    console.error(`[Notify] Error: ${error.message}`);
    console.log(data);
  }
});

/**
 * Send a desktop notification using native OS tools
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 */
function sendNotification(title, message) {
  const platform = os.platform();

  try {
    switch (platform) {
      case 'linux':
        sendLinuxNotification(title, message);
        break;
      case 'darwin':
        sendMacNotification(title, message);
        break;
      case 'win32':
        sendWindowsNotification(title, message);
        break;
      default:
        console.error(`[Notify] Unsupported platform: ${platform}`);
    }
  } catch (error) {
    // Silently fail - notifications are nice-to-have
    console.error(`[Notify] Failed to send notification: ${error.message}`);
  }
}

/**
 * Linux notification using notify-send (libnotify)
 */
function sendLinuxNotification(title, message) {
  // Check if notify-send is available
  try {
    execSync('which notify-send', { stdio: 'pipe' });
    execSync(`notify-send "${escapeShell(title)}" "${escapeShell(message)}"`, {
      stdio: 'pipe',
      timeout: 5000
    });
  } catch {
    // Try alternative: zenity (GNOME)
    try {
      execSync('which zenity', { stdio: 'pipe' });
      // Use spawn to not block
      spawn('zenity', ['--notification', `--text=${title}: ${message}`], {
        detached: true,
        stdio: 'ignore'
      }).unref();
    } catch {
      // No notification tool available
      console.error('[Notify] No notification tool found on Linux (tried: notify-send, zenity)');
    }
  }
}

/**
 * macOS notification using osascript (AppleScript)
 */
function sendMacNotification(title, message) {
  const script = `display notification "${escapeAppleScript(message)}" with title "${escapeAppleScript(title)}"`;
  execSync(`osascript -e '${script}'`, {
    stdio: 'pipe',
    timeout: 5000
  });
}

/**
 * Windows notification using PowerShell toast
 */
function sendWindowsNotification(title, message) {
  // Method 1: PowerShell BurntToast module (if installed)
  // Method 2: PowerShell native toast (Windows 10+)
  // Method 3: msg command (basic fallback)

  const psScript = `
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $template = @"
    <toast>
      <visual>
        <binding template="ToastText02">
          <text id="1">${escapePowerShell(title)}</text>
          <text id="2">${escapePowerShell(message)}</text>
        </binding>
      </visual>
    </toast>
"@

    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($template)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show($toast)
  `.trim().replace(/\n/g, '; ');

  try {
    // Try modern toast notification
    execSync(`powershell -NoProfile -Command "${psScript}"`, {
      stdio: 'pipe',
      timeout: 10000,
      windowsHide: true
    });
  } catch {
    // Fallback: simple balloon tip via PowerShell
    try {
      const fallbackScript = `
        Add-Type -AssemblyName System.Windows.Forms
        $balloon = New-Object System.Windows.Forms.NotifyIcon
        $balloon.Icon = [System.Drawing.SystemIcons]::Information
        $balloon.BalloonTipTitle = '${escapePowerShell(title)}'
        $balloon.BalloonTipText = '${escapePowerShell(message)}'
        $balloon.Visible = $true
        $balloon.ShowBalloonTip(5000)
        Start-Sleep -Seconds 1
        $balloon.Dispose()
      `.trim().replace(/\n/g, '; ');

      execSync(`powershell -NoProfile -Command "${fallbackScript}"`, {
        stdio: 'pipe',
        timeout: 10000,
        windowsHide: true
      });
    } catch {
      console.error('[Notify] Windows notification failed');
    }
  }
}

/**
 * Escape string for shell commands
 */
function escapeShell(str) {
  return str.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

/**
 * Escape string for AppleScript
 */
function escapeAppleScript(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Escape string for PowerShell
 */
function escapePowerShell(str) {
  return str.replace(/'/g, "''").replace(/`/g, '``');
}
