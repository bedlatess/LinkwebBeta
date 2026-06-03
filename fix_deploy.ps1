# LinkWeb deployment repair helper.
# This script intentionally does not store server IPs, passwords, or secrets.

$hostname = $env:LINKWEB_DEPLOY_HOST
$username = $env:LINKWEB_DEPLOY_USER

if (-not $hostname -or -not $username) {
  Write-Host "Set LINKWEB_DEPLOY_HOST and LINKWEB_DEPLOY_USER before opening SSH."
  Write-Host "Example: `$env:LINKWEB_DEPLOY_HOST='your-server.example.com'"
  Write-Host "         `$env:LINKWEB_DEPLOY_USER='deploy'"
  Write-Host ""
} else {
  Write-Host "SSH target: $username@$hostname"
  Write-Host "Connect with: ssh $username@$hostname"
  Write-Host ""
}

Write-Host "IMPORTANT: A plaintext deployment password was previously present in this file."
Write-Host "Rotate that server password or credential in your cloud provider/control panel now."
Write-Host ""
Write-Host "After SSH login, run these checks:"
Write-Host ""
Write-Host "# 1. Check whether the [...nextauth] directory exists"
Write-Host "ls -la /opt/linkweb/src/app/api/auth/"
Write-Host ""
Write-Host "# 2. If missing, recreate it from the repository and redeploy"
Write-Host "cd /opt/linkweb && mkdir -p src/app/api/auth/[...nextauth]"
