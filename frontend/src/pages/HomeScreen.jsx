import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Typography } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';

const HomeScreen = () => {
  const navigate = useNavigate();

  const buttons = [
    {
      text: '접수',
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate('/reception'),
      color: '#4CAF50'
    },
    {
      text: '대기실',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate('/waiting-room'),
      color: '#2196F3'
    },
    {
      text: '진료실',
      icon: <LocalHospitalIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate('/doctor'),
      color: '#9C27B0'
    }
  ];

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5'
      }}
    >
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
        맥스테이션
      </Typography>
      
      <Grid container spacing={3} sx={{ maxWidth: 'md', px: 3 }}>
        {buttons.map((button, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Button
              variant="contained"
              onClick={button.onClick}
              sx={{
                width: '100%',
                height: '150px',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: button.color,
                '&:hover': {
                  bgcolor: button.color,
                  opacity: 0.9
                }
              }}
            >
              {button.icon}
              <Typography variant="h6" sx={{ mt: 2 }}>
                {button.text}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomeScreen; 