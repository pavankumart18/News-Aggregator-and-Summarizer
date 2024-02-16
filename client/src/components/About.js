import React, { useState } from 'react';
import axios from 'axios';

export const About = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const handleInputChange = (e) => {
    setUrl(e.target.value);
  };

  const handleSummarizeClick = async () => {
    try {
      // Make a request to your backend to get information from the provided URL
      const scrapeResponse = await axios.get(`http://localhost:8000/scrape?url=${encodeURIComponent(url)}`);
      const scrapeData = scrapeResponse.data;

      // Extract the information from the response
      const { title, articleBody, summary } = scrapeData;

      // Set the data state with the information
      setTitle(title)
      setSummary(summary)
    } catch (error) {
      console.error('Error scraping or summarizing data:', error);
      alert('Error scraping or summarizing data');
    }
  };

  return (
    <section className="about" id="about">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="about-bx wow zoomIn">
              <h2>Summarize Here!</h2>
              <p>
                TextCraft is an Industry leading AI powered News Summariser, powered by ChatGPT!
                <br />
                Simply provide the URL of any news article, and let our intelligent system analyze and condense the
                information for you, delivering concise and insightful summaries in an instant.
              </p>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control custom-input"
                  placeholder="Paste article URL here"
                  aria-label="Article URL"
                  aria-describedby="summarizeButton"
                  style={{
                    backgroundColor: 'black',
                    color: 'white',
                    border: '1px solid white',
                    padding: '15px',
                    marginRight: '20px',
                    borderRadius: '5px',
                  }}
                  value={url}
                  onChange={handleInputChange}
                />
                <div className="input-group-append">
                  <button
                    className="btn btn-primary"
                    type="button"
                    id="summarizeButton"
                    style={{ padding: '15px', backgroundColor: 'purple' }}
                    onClick={handleSummarizeClick}
                  >
                    Summarize
                  </button>
                </div>
              </div>
              {/* Display summarized data */}
              {summary && (
                <div>
                  <h3>Title:</h3>
                  <p>{title}</p>
                  <h3>Summary:</h3>
                  <p>{summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
