import React, { useState, useEffect } from "react";
import "./ChatPage.css";
import { sendMessageToChatbot } from "../connector";

function ChatPage() {
  const getRandomVideo = () => {
    const videos = ["welcome1.mp4", "welcome2.mp4", "welcome3.mp4"];
    const randomIndex = Math.floor(Math.random() * videos.length);
    return require(`../videos/${videos[randomIndex]}`);
  };

  const [messages, setMessages] = useState([
    { text: "你好，我是Milo, 今天感觉怎么样？", sender: "bot" },
  ]);
  const [inputText, setInputText] = useState("");
  const [videoSrc, setVideoSrc] = useState(getRandomVideo());

  useEffect(() => {
    const interval = setInterval(() => {
      setVideoSrc(getRandomVideo());
    }, 5000); // Change video every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (inputText.trim() === "") return;

    const newMessages = [...messages, { text: inputText, sender: "user" }];
    setMessages(newMessages);
    setInputText("");

    const response = await sendMessageToChatbot(inputText);
    console.log(response);
    if (response.response) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: response.response, sender: "bot" },
      ]);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); 
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="character-panel">
        <h2>Good Morning, Jane 👋</h2>
        <video 
          className="milo-video"
          autoPlay 
          loop 
          muted 
          playsInline
          src={videoSrc}
        />
        <p>Milo</p>
      </div>

      <div className="chat-box">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="How do you feel today?"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={sendMessage}>
            <svg viewBox="0 0 24 24">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="button-container">
        <button className="absolute-button">Random action</button>
        <button className="absolute-button">Action welcome</button>
        <button className="absolute-button">Action happy</button>
        <button className="absolute-button">Action hug</button>
        <button className="absolute-button">Action wait</button>
        <button className="absolute-button">Action nod</button>
        <button className="absolute-button">Action idle</button>
      </div>
    </div>
  );
}

export default ChatPage;
