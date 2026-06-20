import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useExplorerStore } from '../../store/explorerStore';
import type { FileNode } from '../../types';

interface FileTreeProps {
  files: FileNode[];
  onSelectFile: (file: FileNode) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ files, onSelectFile }) => {
  const { expandedFolders, toggleFolder, selectFile } = useExplorerStore();

  const renderTree = (nodes: FileNode[], level: number = 0) =>
    nodes.map((node) => (
      <Box key={node.id} sx={{ marginLeft: `${level * 16}px` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '4px 0',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#2d2d30',
            },
            '&:hover .file-actions': {
              opacity: 1,
            },
          }}
          onClick={() => {
            selectFile(node.id);
            if (node.type === 'file') {
              onSelectFile(node);
            } else {
              toggleFolder(node.id);
            }
          }}
        >
          {node.type === 'folder' && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              sx={{ padding: '2px', width: '20px', height: '20px' }}
            >
              {expandedFolders.has(node.id) ? (
                <ExpandMoreIcon fontSize="small" />
              ) : (
                <ChevronRightIcon fontSize="small" />
              )}
            </IconButton>
          )}
          {node.type === 'folder' ? (
            <FolderIcon fontSize="small" sx={{ color: '#dcb939', marginLeft: '4px' }} />
          ) : (
            <InsertDriveFileIcon fontSize="small" sx={{ color: '#9cdcfe' }} />
          )}
          <Typography variant="body2" sx={{ flex: 1 }}>
            {node.name}
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            className="file-actions"
            sx={{ ml: 'auto', opacity: 0, transition: 'opacity 0.2s' }}
          >
            {node.type === 'folder' && (
              <Tooltip title="Add file">
                <IconButton size="small" sx={{ padding: '2px' }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton size="small" sx={{ padding: '2px' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        {node.type === 'folder' && expandedFolders.has(node.id) && node.children
          ? renderTree(node.children, level + 1)
          : null}
      </Box>
    ));

  return <Box sx={{ color: '#d4d4d4' }}>{renderTree(files)}</Box>;
};

export const Explorer: React.FC = () => {
  const { files, searchQuery, setSearchQuery } = useExplorerStore();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#252526',
        color: '#d4d4d4',
      }}
    >
      <Box sx={{ padding: 1 }}>
        <TextField
          placeholder="Search files..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{
            '& .MuiInputBase-input': {
              color: '#d4d4d4',
              fontSize: '12px',
            },
            '& .MuiOutlinedInput-root': {
              borderColor: '#3e3e42',
            },
          }}
        />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        <FileTree files={files} onSelectFile={() => {}} />
      </Box>
    </Box>
  );
};
