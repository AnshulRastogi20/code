import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

interface CopyrightProps extends React.ComponentProps<typeof Typography> {
  sx?: typeof Typography.prototype.props.sx;
}

export default function Copyright(props: CopyrightProps) {
  return (
    <Typography
      variant="body2"
      align="center"
      {...props}
      sx={[
        {
          color: 'text.secondary',
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      {'Copyright © '}
      <Link color="inherit" href="/">
        AttendIT
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}
