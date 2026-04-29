import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

/**
 * SkeletonCard - Loading placeholder that matches DocumentCard layout
 * Shows animated skeleton while documents are loading
 */
const SkeletonCard: React.FC = () => {
  return (
    <Card
      sx={{
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Skeleton variant="text" height={32} width="80%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" height={16} />
          <Skeleton variant="text" height={16} width="90%" />
          <Skeleton variant="text" height={16} width="70%" />
        </Box>
        <Skeleton variant="text" height={16} width="40%" />
      </CardContent>
    </Card>
  );
};

export default SkeletonCard;
