import { useNavigate } from 'react-router-dom';

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <Button 
      onClick={() => navigate('/doctor')}
      // ... 기존 스타일 속성들
    >
      진료실
    </Button>
  );
}; 