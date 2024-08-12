import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import contactImg from "../assets/img/contact-img.svg";
import 'animate.css';
import TrackVisibility from 'react-on-screen';

export const Contact = () => {
  const formInitialDetails = {
    username: '',
    password: '',
    preferences: []
  }
  const [formDetails, setFormDetails] = useState(formInitialDetails);
  const [buttonText, setButtonText] = useState('Login');
  const [status, setStatus] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

  const onFormUpdate = (category, value) => {
    setFormDetails({
      ...formDetails,
      [category]: value
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setButtonText(isRegistering ? "Registering..." : "Logging In...");

    const endpoint = isRegistering ? "register" : "login";
    try {
      let response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(formDetails),
      });

      let result = await response.json();
      setButtonText(isRegistering ? "Register" : "Login");

      if (response.ok) {
        setStatus({ success: true, message: isRegistering ? 'Registration successful' : 'Login successful' });
        if (!isRegistering) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('preferences', JSON.stringify(result.preferences || formDetails.preferences)); // Save preferences
          setIsLoggedIn(true);
        } else {
          setIsRegistering(false); // Switch to login after successful registration
        }
      } else {
        setStatus({ success: false, message: result.error || 'An error occurred' });
      }

    } catch (error) {
      console.error('Error during submission:', error);
      setStatus({ success: false, message: 'Something went wrong, please try again later.' });
      setButtonText(isRegistering ? "Register" : "Login");
    }
  };

  return (
    <section className="contact" id="connect">
      <Container>
        <Row className="align-items-center">
          <Col size={12} md={6}>
            <TrackVisibility>
              {({ isVisible }) =>
                <img className={isVisible ? "animate__animated animate__zoomIn" : ""} src={contactImg} alt="Contact Us"/>
              }
            </TrackVisibility>
          </Col>
          <Col size={12} md={6}>
            <TrackVisibility>
              {({ isVisible }) =>
                <div className={isVisible ? "animate__animated animate__fadeIn" : ""}>
                  <h2>{isLoggedIn ? 'Welcome to Your Personalized Feed' : isRegistering ? 'Register for Personalized Feed' : 'Login for Personalized Feed'}</h2>
                  {!isLoggedIn && (
                    <form onSubmit={handleSubmit}>
                      <Row>
                        <Col size={12} md={4} className="px-1">
                          <input type="text" value={formDetails.username} placeholder="Username" onChange={(e) => onFormUpdate('username', e.target.value)} />
                        </Col>
                        <Col size={12} md={4} className="px-1">
                          <input type="password" value={formDetails.password} placeholder="Password" onChange={(e) => onFormUpdate('password', e.target.value)}/>
                        </Col>
                        {isRegistering && (
                          <Col size={12} md={4} className="px-1">
                            <select
                              multiple
                              value={formDetails.preferences}
                              onChange={(e) => onFormUpdate('preferences', Array.from(e.target.selectedOptions, option => option.value))}
                            >
                              {categories.map((category, index) => (
                                <option key={index} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
                              ))}
                            </select>
                          </Col>
                        )}
                        <Col size={12} md={12} className="px-1">
                          <button type="submit"><span>{buttonText}</span></button>
                        </Col>
                        {
                          status.message &&
                          <Col size={12} md={12} className="px-1">
                            <p className={status.success === false ? "danger" : "success"}>{status.message}</p>
                          </Col>
                        }
                        <Col size={12} md={12} className="px-1">
                          <p>
                            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                            <span 
                              style={{ color: 'blue', cursor: 'pointer' }} 
                              onClick={() => {
                                setIsRegistering(!isRegistering);
                                setStatus({});
                              }}
                            >
                              {isRegistering ? 'Register' : 'Login'}
                            </span>
                          </p>
                        </Col>
                      </Row>
                    </form>
                  )}
                </div>}
            </TrackVisibility>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
