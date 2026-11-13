ICT EQUIPMENT PHOTO LIBRARY — WINDOWS DOWNLOAD PACKAGE

This package contains a PowerShell downloader that retrieves actual equipment
photographs from Wikimedia Commons and creates a ZIP archive on your computer.

HOW TO USE
1. Extract this package to a folder.
2. Open that folder in File Explorer.
3. Right-click Download-ICT-Photos.ps1 and choose "Run with PowerShell".
   Alternatively, open PowerShell in this folder and run:
       powershell -ExecutionPolicy Bypass -File .\Download-ICT-Photos.ps1
4. Allow it to finish. It needs an active internet connection.
5. The script creates:
       ICT_Equipment_Photo_Library.zip

CONTENTS
The downloader searches for 43 types of equipment and saves photographs into
category folders. The first 13 filenames align with the user's React examples:
mouse.jpg, keyboard.jpg, monitor.jpg, system-unit.jpg, cpu.jpg,
motherboard.jpg, ram.jpg, ssd-hdd.jpg, printer.jpg, scanner.jpg,
usb-flash.jpg, router-switch.jpg, air-blower.jpg.

IMAGE SOURCES AND LICENSING
Images are retrieved from Wikimedia Commons. The generated ZIP includes
ATTRIBUTION.csv with the Commons file page, creator information when supplied,
and the reported licence for each downloaded image. Check each source page
before using an image in a public/commercial product. Respect attribution,
share-alike, and other licence requirements.

NOTE
The ZIP of photos is generated locally by the script because this environment
cannot directly download binary files from external image repositories.
