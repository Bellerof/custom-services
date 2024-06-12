$VideosPath = "$env:USERPROFILE\Videos\"
$CompressorPath = "$env:USERPROFILE\Documents\Code\custom-services\compress-nvidia-clips\"
$NodeExecutablePath = "$env:USERPROFILE\AppData\Local\fnm_multishells\20936_1718127733199\node.EXE"

Invoke-Expression "$NodeExecutablePath '$CompressorPath\index.js' path=$VideosPath maxSize=52428800"
