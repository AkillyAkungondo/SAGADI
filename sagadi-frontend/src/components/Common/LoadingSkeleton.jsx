import React from 'react';
import { Skeleton, Stack, Box } from '@mui/material';

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <Stack spacing={1}>
      {[...Array(rows)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1 }}>
          {[...Array(cols)].map((_, j) => (
            <Skeleton 
              key={j} 
              variant="rectangular" 
              width={`${100 / cols}%`} 
              height={40} 
              animation="wave"
            />
          ))}
        </Box>
      ))}
    </Stack>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {[...Array(count)].map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          width={250}
          height={150}
          animation="wave"
          sx={{ borderRadius: 2 }}
        />
      ))}
    </Box>
  );
};