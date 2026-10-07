Add-Type -AssemblyName System.Drawing

$imgPath = "C:\Users\Usuario\.gemini\antigravity-ide\brain\e19910ef-04b4-4a40-94b0-f49c9de4d6af\media__1791406373169.png"
$destPath = "c:\Users\Usuario\Downloads\Anime-Live-Detector-v2\Anime-Live-Detector\public\uploads\mbappe_card_exact.png"

$src = [System.Drawing.Bitmap]::FromFile($imgPath)
Write-Host "Source Dimensions: $($src.Width) x $($src.Height)"

# In 1080x608 or similar screenshot:
# Card "Mbappe 91 ST" is located around:
# Left: 519, Top: 310, Width: 180, Height: 225 (scaled to original)

$cropX = [int]($src.Width * 0.518)
$cropY = [int]($src.Height * 0.515)
$cropW = [int]($src.Width * 0.178)
$cropH = [int]($src.Height * 0.365)

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$cropped = $src.Clone($rect, $src.PixelFormat)
$cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$cropped.Dispose()

Write-Host "Cropped card saved successfully to $destPath!"
