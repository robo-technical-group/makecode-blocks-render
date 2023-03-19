Param(
    [Parameter(Mandatory=$true)]
    [string[]] $SourceFolders
)

foreach($path in $SourceFolders) {
    node.js .\render-blocks.js "$path"
}
