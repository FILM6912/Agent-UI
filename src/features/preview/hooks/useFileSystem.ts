import { useState, useMemo } from "react";
import { FileNode } from "../components/FileTreeItem";

const getInitialExpandedPaths = (nodes: FileNode[], prefix = ""): string[] => {
  let paths: string[] = [];
  nodes.forEach((node) => {
    const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === "folder" && node.isOpen) {
      paths.push(currentPath);
      if (node.children) {
        paths = paths.concat(
          getInitialExpandedPaths(node.children, currentPath),
        );
      }
    }
  });
  return paths;
};

export const useFileSystem = (initialFileSystem: FileNode[]) => {
  const [fileSystem] = useState<FileNode[]>(initialFileSystem);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);

  const initialExpanded = useMemo(
    () => getInitialExpandedPaths(fileSystem),
    [fileSystem],
  );

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(initialExpanded),
  );

  const toggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const selectFile = (path: string, node: FileNode) => {
    setSelectedFile(path);
    setSelectedNode(node);
  };

  return {
    fileSystem,
    selectedFile,
    selectedNode,
    expandedPaths,
    toggleFolder,
    selectFile,
  };
};
