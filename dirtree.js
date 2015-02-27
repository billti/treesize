/// <reference path="node.d.ts"/>
var path = require('path');
var findit = require('findit');
// Get the folder to start from
var root = process.cwd();
var finder = findit(root);
var graph = { size: 0, totalSize: 0, subdirs: {} };
finder.on('directory', function (fullpath, stat, stop) {
    // Stats for directories do not set size.  Note this does get called for the root dir first.
    // Ensure it is added, so that even dirs with no files are captured
    getDirInTree(fullpath);
});
finder.on('file', function (fullpath, stat) {
    addFileSizeToDir(fullpath, stat.size);
});
finder.on('end', function () {
    var colWidth = 15;
    var padding = "                                                                              ";
    var indent = 4;
    var currIndent = 1;
    var header = (padding + "Total size").slice(-colWidth);
    var underl = (padding + "----------").slice(-colWidth);
    header += (padding + "Folder size").slice(-colWidth);
    underl += (padding + "-----------").slice(-colWidth);
    header += "    Folder name";
    underl += "    -----------";
    console.log(header);
    console.log(underl);
    // Depth first recursion to roll up the each dir size to totalSize
    getDirTotal(graph);
    function getDirTotal(dir) {
        var total = dir.size;
        for (var subdir in dir.subdirs) {
            total = total + getDirTotal(dir.subdirs[subdir]);
        }
        return dir.totalSize = total;
    }
    writeDir(graph, root);
    function writeDir(dir, name) {
        var totalText = (padding + dir.totalSize).slice(-colWidth);
        var sizeText = (padding + dir.size).slice(-colWidth);
        var dirText = padding.slice(-(currIndent * indent)) + name;
        console.log(totalText + sizeText + dirText);
        currIndent++;
        for (var subdir in dir.subdirs) {
            writeDir(dir.subdirs[subdir], subdir);
        }
        currIndent--;
    }
});
function getDirInTree(fullPath) {
    // For root, this will result in an empty string and no parts
    var relativePath = path.relative(root, fullPath);
    var parts = relativePath.split(path.sep);
    // For each part, find or create the resulting entry
    var result = graph;
    parts.forEach(function (part) {
        if (!part)
            return; // Split an empty string (the root path) results in ['']
        if (!(part in result.subdirs)) {
            result.subdirs[part] = { size: 0, totalSize: 0, subdirs: {} };
        }
        result = result.subdirs[part];
    });
    return result;
}
function addFileSizeToDir(fullPath, size) {
    var dir = path.dirname(fullPath);
    var entry = getDirInTree(dir);
    entry.size += size;
}
