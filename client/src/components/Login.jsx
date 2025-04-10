import React, { useContext, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import ResetStyles from '../Reset.css';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #333;
  margin: 0;
  padding: 0;
`;

const FormWrapper = styled.div`
  background: rgba(255, 190, 0);
  padding: 60px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: black;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: black;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 10px;
  margin-bottom: 20px;
  border: none;
  border-radius: 4px;
  background: white;
  color: black;
`;

const Button = styled.button`
  padding: 15px;
  border: none;
  border-radius: 4px;
  background: #333;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background: rgba(70, 70, 70);
  }
`;

const Error = styled.p`
  color: black;
  text-align: center;
`;

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();
  const { setUser } = useContext(UserContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');  // Clear any previous error messages
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { name, password });
      if (response.data.success) {
        const { name, type, enquete } = response.data;
        setUser({ name, type, enquete });
        localStorage.setItem('user', JSON.stringify({ name, type, enquete }));
        if (type === 'administrateur') {
          history.push('/dashboard');
        } else if (type === 'enqueteur') {
          history.push('/enqueteur');
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('There was an error logging in!', err);
      setError('An error occurred. Please try again later.');
    }
  };

  return (
      <Container>
        <FormWrapper>
          <Title>Sign In</Title>
          <Form onSubmit={handleSubmit}>
            <Label>Username:</Label>
            <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Label>Password:</Label>
            <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit">Sign In</Button>
          </Form>
          {error && <Error>{error}</Error>}
        </FormWrapper>
      </Container>
  );
};

export default Login;
