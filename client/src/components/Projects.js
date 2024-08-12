import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Tab, Nav } from 'react-bootstrap';
import dummyImage from './dummy.png';
import colorSharp2 from '../assets/img/color-sharp2.png';
import 'animate.css';
import TrackVisibility from 'react-on-screen';

export const Projects = () => {
  const [news, setNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('business');
  const [error, setError] = useState(null);
  const [filteredNews, setFilteredNews] = useState([]);
  const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

  useEffect(() => {
    // Fetch news data from your backend server
    axios.get('http://localhost:8000/api/news')
      .then(response => {
        setNews(response.data);
        // Filter news based on preferences
        const preferences = JSON.parse(localStorage.getItem('preferences')) || [];
        console.log('Preferences:', preferences);

        // Set filtered news based on preferences or show all if preferences are empty
        if (preferences.length === 0) {
          setFilteredNews(response.data);
        } else {
          const filtered = response.data.filter(article => preferences.includes(article.category));
          setFilteredNews(filtered);
        }
      })
      .catch(error => {
        console.error('Error fetching news:', error);
        setError('Error fetching news. Please try again later.');
      });
  }, []);

  // Function to group news by category
  const groupNewsByCategory = () => {
    const groupedNews = {};
    filteredNews.forEach(article => {
      const category = article.category || 'Uncategorized';
      if (!groupedNews[category]) {
        groupedNews[category] = [];
      }
      groupedNews[category].push(article);
    });
    return groupedNews;
  };

  const groupedNews = groupNewsByCategory();

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
                      className="nav-pills mb-5 justify-content-center align-items-center"
                      id="pills-tab"
                    >
                      {categories.map((category, index) => (
                        <Nav.Item key={index}>
                          <Nav.Link eventKey={category.toLowerCase()}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Nav.Link>
                        </Nav.Item>
                      ))}
                    </Nav>
                    <Tab.Content id="slideInUp" className={isVisible ? 'animate__animated animate__slideInUp' : ''}>
                      {categories.map((category, index) => (
                        <Tab.Pane key={index} eventKey={category.toLowerCase()}>
                          <Row>
                            {(groupedNews[category] || []).map((article, articleIndex) => (
                              <Col key={articleIndex} size={12} sm={6} md={4}>
                                <div className="proj-imgbx">
                                  <img
                                    src={article.urlToImage || dummyImage}
                                    alt="News article"
                                    style={{ maxWidth: '100%', height: '200px', objectFit: 'cover' }}
                                  />
                                  <a
                                    href={article.url}
                                    style={{ color: 'white', textDecoration: 'none' }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <div className="proj-txtx" style={{ padding: '20px' }}>
                                      <h6>{article.title}</h6>
                                    </div>
                                  </a>
                                </div>
                              </Col>
                            ))}
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
  );
};
