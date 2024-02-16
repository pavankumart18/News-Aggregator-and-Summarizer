import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Tab, Nav } from "react-bootstrap";
import projImg1 from "../assets/img/project-img1.png";
import projImg2 from "../assets/img/project-img2.png";
import projImg3 from "../assets/img/project-img3.png";
import colorSharp2 from "../assets/img/color-sharp2.png";
import 'animate.css';
import TrackVisibility from 'react-on-screen';

export const Projects = () => {
  const [news, setNews] = useState([]);
  console.log(news)
  const [selectedCategory, setSelectedCategory] = useState('business');
  const [error, setError] = useState(null);
  const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
  useEffect(() => {
    // Fetch news data from your backend server
    axios.get('http://localhost:8000/api/news')
      .then(response => setNews(response.data))
      .catch(error => {
        console.error('Error fetching news:', error);
        setError('Error fetching news. Please try again later.');
      });
  }, []);

  // Function to group news by category
  const groupNewsByCategory = () => {
    const groupedNews = {};
    news.forEach(article => {
      const category = article.category || 'Uncategorized';
      if (!groupedNews[category]) {
        groupedNews[category] = [];
      }
      groupedNews[category].push(article);
    });
    console.log(groupedNews)
    return groupedNews;
  };
  

  return (
    <section className="project" id="projects">
      <Container>
        <Row>
          <Col size={12}>
            <TrackVisibility>
              {({ isVisible }) => (
                <div className={isVisible ? 'animate__animated animate__fadeIn' : ''}>
                  <h2>News</h2>
                  <p>
                    Our AI-powered news aggregator brings you the latest headlines, curated just for you. From breaking
                    news to in-depth analysis, TextCraft delivers the stories that matter most.
                  </p>
                  <Tab.Container id="projects-tabs" activeKey={selectedCategory} onSelect={(key) => setSelectedCategory(key)}>
                    <Nav
                      variant="pills"
                      className="nav-pills mb-5 justify-content-center align-items-center "
                      id="pills-tab"
                    >
                      {categories.map((category, index) => (
                        <Nav.Item key={index}>
                          <Nav.Link eventKey={category.toLowerCase()}>{category.charAt(0).toUpperCase() + category.slice(1)}</Nav.Link>
                        </Nav.Item>
                      ))}
                    </Nav>
                    <Tab.Content id="slideInUp" className={isVisible ? 'animate__animated animate__slideInUp' : ''}>
                      {categories.map((category, index) => (
                        <Tab.Pane key={index} eventKey={category.toLowerCase()}>
                          <Row>
                            {(groupNewsByCategory()[category] || []).map((article, articleIndex) =>
                              article.imageUrl ? (
                                <Col key={articleIndex} size={12} sm={6} md={4}>
                                  <div className="proj-imgbx">
                                    <img
                                      src={article.imageUrl}
                                      alt="hii"
                                      style={{ maxWidth: '100%', height: '200px', objectFit: 'cover' }}
                                    />
                                    <a href={article.url} style={{ color: 'white', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer" >
                                    <div className="proj-txtx" style={{ padding: '20px' }} >
                                      <h6>{article.title}</h6>
                      
                                    </div>
                                    </a>
                                  </div>
                                </Col>
                              ) : null
                            )} 
                          </Row>
                        </Tab.Pane>
                      ))}
                    </Tab.Content>
                  </Tab.Container>
                </div>
              )}
            </TrackVisibility>
          </Col>
        </Row>
      </Container>
      <img className="background-image-right" src={colorSharp2} alt="background" />
    </section>
  )}
