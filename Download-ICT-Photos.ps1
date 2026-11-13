# ICT Equipment Photo Library Downloader
# Downloads actual photographs from Wikimedia Commons, records attribution,
# and creates ICT_Equipment_Photo_Library.zip.
# Run in Windows PowerShell 5.1+ or PowerShell 7 with internet access.

$ErrorActionPreference = "Continue"
$Root = Join-Path $PSScriptRoot "ICT_Equipment_Photo_Library"
$ZipPath = Join-Path $PSScriptRoot "ICT_Equipment_Photo_Library.zip"
$Attribution = Join-Path $Root "ATTRIBUTION.csv"

if (Test-Path $Root) { Remove-Item $Root -Recurse -Force }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
New-Item -ItemType Directory -Path $Root -Force | Out-Null

$Items = @(
    @{Folder="input_devices"; File="mouse.jpg"; Search="computer mouse device"},
    @{Folder="input_devices"; File="keyboard.jpg"; Search="computer keyboard"},
    @{Folder="output_devices"; File="monitor.jpg"; Search="computer monitor display"},
    @{Folder="processing_devices"; File="system-unit.jpg"; Search="desktop computer tower case"},
    @{Folder="processing_devices"; File="cpu.jpg"; Search="computer CPU processor chip"},
    @{Folder="processing_devices"; File="motherboard.jpg"; Search="computer motherboard"},
    @{Folder="processing_devices"; File="ram.jpg"; Search="desktop RAM memory module DIMM"},
    @{Folder="storage_devices"; File="ssd-hdd.jpg"; Search="solid state drive hard disk drive"},
    @{Folder="output_devices"; File="printer.jpg"; Search="computer printer"},
    @{Folder="input_devices"; File="scanner.jpg"; Search="flatbed document scanner"},
    @{Folder="storage_devices"; File="usb-flash.jpg"; Search="USB flash drive"},
    @{Folder="networking_devices"; File="router-switch.jpg"; Search="wifi router network switch"},
    @{Folder="maintenance_tools"; File="air-blower.jpg"; Search="electric air duster computer cleaning blower"},
    @{Folder="input_devices"; File="webcam.jpg"; Search="computer webcam"},
    @{Folder="input_devices"; File="microphone.jpg"; Search="USB computer microphone"},
    @{Folder="output_devices"; File="speakers.jpg"; Search="computer speakers"},
    @{Folder="output_devices"; File="projector.jpg"; Search="digital projector"},
    @{Folder="input_devices"; File="digital-camera.jpg"; Search="digital camera"},
    @{Folder="input_devices"; File="joystick.jpg"; Search="computer joystick controller"},
    @{Folder="input_devices"; File="barcode-scanner.jpg"; Search="barcode scanner"},
    @{Folder="input_devices"; File="touchscreen.jpg"; Search="touchscreen monitor"},
    @{Folder="storage_devices"; File="external-hard-drive.jpg"; Search="external hard disk drive"},
    @{Folder="storage_devices"; File="memory-card.jpg"; Search="SD memory card"},
    @{Folder="storage_devices"; File="cd-dvd.jpg"; Search="CD DVD optical disc"},
    @{Folder="networking_devices"; File="modem.jpg"; Search="internet modem"},
    @{Folder="networking_devices"; File="ethernet-cable.jpg"; Search="Ethernet network cable RJ45"},
    @{Folder="networking_devices"; File="network-card.jpg"; Search="Ethernet network interface card"},
    @{Folder="networking_devices"; File="fibre-optic-cable.jpg"; Search="fiber optic cable"},
    @{Folder="power_devices"; File="ups.jpg"; Search="computer uninterruptible power supply UPS"},
    @{Folder="power_devices"; File="voltage-stabiliser.jpg"; Search="voltage stabilizer electrical"},
    @{Folder="power_devices"; File="power-supply.jpg"; Search="ATX computer power supply unit"},
    @{Folder="processing_devices"; File="cooling-fan.jpg"; Search="computer cooling fan"},
    @{Folder="processing_devices"; File="heat-sink.jpg"; Search="computer CPU heatsink"},
    @{Folder="maintenance_tools"; File="screwdriver-kit.jpg"; Search="precision computer screwdriver set"},
    @{Folder="maintenance_tools"; File="anti-static-wrist-strap.jpg"; Search="anti static wrist strap"},
    @{Folder="modern_ict_devices"; File="laptop.jpg"; Search="laptop computer"},
    @{Folder="modern_ict_devices"; File="tablet.jpg"; Search="tablet computer"},
    @{Folder="modern_ict_devices"; File="smartphone.jpg"; Search="smartphone device"},
    @{Folder="modern_ict_devices"; File="smartboard.jpg"; Search="interactive whiteboard smart board"},
    @{Folder="modern_ict_devices"; File="vr-headset.jpg"; Search="virtual reality headset"},
    @{Folder="modern_ict_devices"; File="server-rack.jpg"; Search="server rack data center"},
    @{Folder="modern_ict_devices"; File="server.jpg"; Search="rack mounted computer server"}
)

$Rows = New-Object System.Collections.Generic.List[object]
$Headers = @{ "User-Agent" = "ICTEquipmentPhotoLibrary/1.0 (educational image collection)" }

function Get-CommonsPhoto([string]$SearchTerm) {
    $q = [uri]::EscapeDataString($SearchTerm)
    $api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$q&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json"
    try {
        $data = Invoke-RestMethod -Uri $api -Headers $Headers -TimeoutSec 35
        if (-not $data.query.pages) { return $null }
        $pages = @($data.query.pages.PSObject.Properties | ForEach-Object { $_.Value })
        foreach ($page in $pages) {
            if (-not $page.imageinfo -or -not $page.imageinfo[0].thumburl) { continue }
            $ii = $page.imageinfo[0]
            $mime = [string]$ii.mime
            if ($mime -notmatch '^image/(jpeg|png|webp)$') { continue }
            $meta = $ii.extmetadata
            $license = [string]$meta.LicenseShortName.value
            if ([string]::IsNullOrWhiteSpace($license)) { $license = "Check Commons file page" }
            return [pscustomobject]@{
                Url = $ii.thumburl
                Page = $ii.descriptionurl
                Title = $page.title
                License = ($license -replace '<[^>]+>','')
                Artist = ([string]$meta.Artist.value -replace '<[^>]+>','')
                Credit = ([string]$meta.Credit.value -replace '<[^>]+>','')
            }
        }
    } catch {
        Write-Warning "Commons lookup failed for '$SearchTerm': $($_.Exception.Message)"
    }
    return $null
}

foreach ($item in $Items) {
    $folder = Join-Path $Root $item.Folder
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $destination = Join-Path $folder $item.File
    Write-Host "Finding photo: $($item.Search)" -ForegroundColor Cyan
    $photo = Get-CommonsPhoto $item.Search
    if ($null -eq $photo) {
        Write-Warning "No suitable photo found for $($item.File)."
        continue
    }
    try {
        Invoke-WebRequest -Uri $photo.Url -Headers $Headers -OutFile $destination -TimeoutSec 60
        if ((Test-Path $destination) -and (Get-Item $destination).Length -gt 3000) {
            $Rows.Add([pscustomobject]@{
                Filename = (Join-Path $item.Folder $item.File).Replace("\","/")
                CommonsFile = $photo.Title
                License = $photo.License
                Creator = $photo.Artist
                Credit = $photo.Credit
                SourcePage = $photo.Page
            })
            Write-Host "Downloaded $($item.File)" -ForegroundColor Green
        } else {
            Remove-Item $destination -Force -ErrorAction SilentlyContinue
            Write-Warning "Downloaded file was too small; skipped."
        }
    } catch {
        Write-Warning "Download failed for $($item.File): $($_.Exception.Message)"
    }
    Start-Sleep -Milliseconds 350
}

$Rows | Export-Csv -Path $Attribution -NoTypeInformation -Encoding UTF8
@"
ICT EQUIPMENT PHOTO LIBRARY

This folder contains actual photographs retrieved from Wikimedia Commons.
The image filenames are intended to match a React equipment-photo catalogue.

IMPORTANT:
- Review ATTRIBUTION.csv before publishing or redistributing the images.
- Each image retains its source file page and reported licence.
- Follow the individual licence conditions, including attribution and share-alike
  requirements where applicable.
- A Commons search result is not a guarantee that every image is suitable.
  Check the source page and confirm the depicted item before classroom use.
- Some requested items may be missing if Commons has no suitable result.

Image folders:
input_devices, output_devices, processing_devices, storage_devices,
networking_devices, power_devices, maintenance_tools, modern_ict_devices.
"@ | Set-Content -Path (Join-Path $Root "README.txt") -Encoding UTF8

$downloaded = (Get-ChildItem $Root -Recurse -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' }).Count
if ($downloaded -eq 0) {
    Write-Error "No photos were downloaded. Check your internet connection and try again."
    exit 1
}
Compress-Archive -Path (Join-Path $Root "*") -DestinationPath $ZipPath -CompressionLevel Optimal
Write-Host ""
Write-Host "Completed: $downloaded photos downloaded." -ForegroundColor Green
Write-Host "ZIP created: $ZipPath" -ForegroundColor Green
Write-Host "Attribution record: $Attribution"
