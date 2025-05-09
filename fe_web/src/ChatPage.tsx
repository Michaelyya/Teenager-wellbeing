import { sendMessageToChatbot, savePreferencesToBackend } from "./connector";
import happy from "./videos/happy.mp4";
import love from "./videos/love.mp4";
import support from "./videos/support.mp4";
import dance from "./videos/dance.mp4";
import action5 from "./videos/action5.mp4";
import action11 from "./videos/action11.mp4";
import action12 from "./videos/action12.mp4";
import sad from "./videos/sad.mp4";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { TbSquareRoundedLetterM } from "react-icons/tb";
import backgroundImage from "./images/background.png";

function ChatPage() {
  const navigate = useNavigate();

  // State
  const [messages, setMessages] = useState([
    { text: "你好，我是Milo, 你的情感助手，可以告诉我你的名字吗？", sender: "bot", timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState("");
  const [currentVideo, setCurrentVideo] = useState(action5);
  const [showNextButton, setShowNextButton] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(
    location.state?.preferences || JSON.parse(localStorage.getItem('chatPreferences') || '{}')
  );
  
  // Preferences states
  const [language, setLanguage] = useState(preferences.language || '');
  const [purpose, setPurpose] = useState(preferences.purpose || '');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(preferences.personalityTraits || []);
  const [selectedTone, setSelectedTone] = useState(preferences.tone || '');
  const [selectedTitle, setSelectedTitle] = useState(preferences.titlePreference || '');
  const [selectedProperNoun, setSelectedProperNoun] = useState(preferences.properNoun || '');
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<number | undefined>(undefined);
  
  // Video constants
  const defaultVideos = [action5, action11, action12];
  const actionVideos = {
    happy: happy,
    love: love,
    support: support,
    sad: sad,
    dance: dance,
  };

  // Preference options
  const personalityTraits = [
    'Openness', 'Closedness', 'Agreeable', 'Non-Agreeable', 'Conscientiousness', 'Unconscientiousness',
  ];

  const tones = [
    'Formal', 'Casual'
  ];

  const titles = [
    'Personal and Informal Titles', 'Professional and Formal Titles', 'Avoiding Use of Titles'
  ];

  const properNouns = ['him/his', 'her/she'];
  
  const [emojisArray, setEmojisArray] = useState<Array<{id: number, left: number, top: number, emoji: string, speed: number, size: number}>>([]);
  
  useEffect(() => {
    startDefaultCycle();
    
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const startDefaultCycle = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const randomIndex = Math.floor(Math.random() * defaultVideos.length);
    setCurrentVideo(defaultVideos[randomIndex]);
    
    intervalRef.current = window.setInterval(() => {
      setCurrentVideo(prev => {
        const availableVideos = defaultVideos.filter(video => video !== prev);
        return availableVideos[Math.floor(Math.random() * availableVideos.length)];
      });
    }, 10000);
  };

  const addEmojiFall = (type: string, quantity = 80, speed = 15) => {
    const emojis = { sad: '😢', dance: '💃', happy: '😊', support: '🤗', love: '❤️' };
    const emoji = emojis[type as keyof typeof emojis] || '✨';
    
    setEmojisArray([]);
    
    for (let i = 0; i < quantity; i++) {
      setTimeout(() => {
        const newEmoji = {
          id: Date.now() + i,
          left: Math.floor(Math.random() * 100),
          top: -30,
          emoji: emoji,
          speed: speed,
          size: Math.floor(36 + Math.random() * 20)
        };
        
        setEmojisArray(prev => [...prev, newEmoji]);
        
        const animationInterval = window.setInterval(() => {
          setEmojisArray(prev => prev.map(em => em.id === newEmoji.id ? 
            { ...em, top: em.top + em.speed } : em
          ).filter(em => em.top < window.innerHeight));
        }, 20);
        
        setTimeout(() => {
          clearInterval(animationInterval);
          setEmojisArray(prev => prev.filter(em => em.id !== newEmoji.id));
        }, 3000);
      }, i * 20);
    }
  };

  const playSpecificVideo = (videoKey: string) => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    
    const videoToPlay = actionVideos[videoKey as keyof typeof actionVideos] || defaultVideos[0];
    setCurrentVideo(videoToPlay);
    
    timeoutRef.current = window.setTimeout(() => {
      startDefaultCycle();
    }, (videoRef.current?.duration || 5) * 1000);
    
    const emojiConfigs = {
      sad: [100, 5],
      happy: [120, 6],
      dance: [130, 6.5],
      support: [110, 5.5],
      love: [150, 7]
    };
    
    addEmojiFall(videoKey, ...(emojiConfigs[videoKey as keyof typeof emojiConfigs] || [80, 5]));
  };

  const playEmotionVideo = (emotion: string) => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);

    const emotionVideos = {
      happy: happy,
      love: love,
      support: support,
      sad: sad,
      neutral: defaultVideos[Math.floor(Math.random() * defaultVideos.length)]
    };
    
    setCurrentVideo(emotionVideos[emotion as keyof typeof emotionVideos] || defaultVideos[0]);
    
    timeoutRef.current = window.setTimeout(() => {
      startDefaultCycle();
    }, (videoRef.current?.duration || 5) * 1000);
    
    addEmojiFall(emotion, ...{
      sad: [100, 5],
      happy: [120, 6],
      love: [150, 7],
      support: [110, 5.5]
    }[emotion] || [80, 5]);
  };

  // const handleNext = async () => {
  //   setShowNextButton(false);
  //   setIsTyping(true);
  //   playSpecificVideo('thinking');
    
  //   const response = await sendMessageToChatbot("next");
  //   setIsTyping(false);
    
  //   if (response.response) {
  //     setMessages(prev => [...prev, { 
  //       text: response.response, 
  //       sender: "bot", 
  //       timestamp: new Date() 
  //     }]);
      
  //     if (response.user_emotion) {
  //       playEmotionVideo(response.user_emotion.toLowerCase());
  //     }
  //   }
  // };

  const handleTraitToggle = (trait: string) => {
    setSelectedTraits(prev => prev.includes(trait) 
      ? prev.filter(t => t !== trait) 
      : [...prev, trait]
    );
  };

  const savePreferences = async () => {
    const newPreferences = {
      language,
      purpose,
      personalityTraits: selectedTraits,
      tone: selectedTone,
      titlePreference: selectedTitle,
      properNoun: selectedProperNoun
    };
    
    localStorage.setItem('chatPreferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    await savePreferencesToBackend(newPreferences);
    setShowPreferences(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessages = [...messages, { 
      text: inputText, 
      sender: "user", 
      timestamp: new Date() 
    }];
    
    setMessages(newMessages);
    setInputText("");
    setIsTyping(true);
    playSpecificVideo('waiting');

    const response = await sendMessageToChatbot(inputText, preferences);
    setIsTyping(false);
    
    if (response.response) {
      setMessages(prev => [...prev, { 
        text: response.response, 
        sender: "bot", 
        timestamp: new Date() 
      }]);
      
      if (response.user_emotion) playEmotionVideo(response.user_emotion.toLowerCase());
      if (response.move_to_next) setShowNextButton(true);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault(); 
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen max-h-screen font-sans text-xl flex flex-col">
      {/* Background */}
      <div 
        className="absolute top-0 left-0 w-full h-full z-0 bg-center bg-cover opacity-60 filter blur-0 transition-all duration-normal"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm shadow-sm border-b border-border relative z-10">
        <div className="flex items-center gap-3 text-xl  font-bold text-black cursor-pointer" onClick={() => navigate('/')}>
          <TbSquareRoundedLetterM className="w-8 h-8" />
          <span>Milo AI</span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowPreferences(true)} 
            className="cursor-pointer flex items-center gap-2 px-4 text-text-secondary border-2 border-black/50 hover:scale-105 rounded-lg transition-colors duration-normal"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            偏好
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row p-6 gap-6 max-w-7xl mx-auto flex-1 relative z-2 h-[80vh]">
        {/* Video Panel */}
        <div className="lg:w-2/3 bg-bg-transparent/70 rounded-xl shadow-lg p-4 backdrop-blur-sm border border-border animate-[slideInLeft_0.6s_ease-out]">
          <div className="relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-transparent before:to-transparent before:rounded-t-lg h-full">
            <video 
              ref={videoRef}
              key={currentVideo}
              autoPlay
              loop
              muted
              className="w-full h-full object-cover rounded-lg"
            >
              <source src={currentVideo} type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:w-1/2 bg-transparent rounded-xl shadow-lg p-6 backdrop-blur-sm border border-border animate-[slideInRight_0.6s_ease-out] flex flex-col relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-transparent before:to-transparent before:rounded-t-lg">
          <div className="flex-1 mb-4 space-y-4 overflow-y-auto max-h-screen">
            {messages.map((msg, index) => (
              <div key={index} className={`p-4 rounded-lg max-w-[80%] transition-all duration-normal ${
                msg.sender === 'bot' 
                  ? 'border border-gray-200 bg-green-200/40 mr-auto' 
                  : 'border border-gray-400 bg-blue-200/40 ml-auto'
              }`}>
                <p className="text-text-transparent">{msg.text}</p>
                <p className="text-xs text-text-secondary mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {isTyping && (
              <div className="flex space-x-2 p-4 bg-transparent-light/50 rounded-lg w-24">
                <div className="w-2 h-2 bg-black/40 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-black/50 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-black/60 rounded-full animate-bounce delay-200"></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你的消息..."
              className="flex-1 px-4 py-2 border border-border rounded-lg bg-white/80"
            />
            <button 
              onClick={sendMessage}
              className="px-6 py-2 border-1 border-black cursor-pointer hover:scale-105 rounded-lg transition-colors duration-normal shadow-md relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:animate-shimmer"
            >
              发送
            </button>
          </div>
        </div>
      </div>

{/* Preferences Modal */}
{showPreferences && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-md">
    <div className="bg-white/90 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 animate-[fadeIn_0.3s_ease-out]">
      <div className="px-6 py-4 space-y-5">
        <h2 className="text-2xl font-bold text-gray-700 border-b pb-2">聊天偏好设置</h2>

        <div>
          <h3 className="font-semibold mb-1 text-gray-600">语言</h3>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="请输入首选语言"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-1 text-gray-600">对话目的</h3>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="请输入对话目的"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-600">称呼偏好</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {titles.map((title) => (
              <button
                key={title}
                onClick={() => setSelectedTitle(title)}
                className={`p-2 rounded-lg border transition-all duration-200 text-left hover:bg-[#AEC9A0] hover:border-[#9DC08B]

                  ${selectedTitle === title ? 'bg-[#9DC08B] border-[#9DC08B] font-medium' : 'bg-white border-gray-300'
                  }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-600">人称代词</h3>
          <div className="grid grid-cols-2 gap-2">
            {properNouns.map((noun) => (
              <button
                key={noun}
                onClick={() => setSelectedProperNoun(noun)}
                className={`p-2 rounded-lg border transition-all duration-200 hover:bg-[#AEC9A0] hover:border-[#9DC08B]

                  ${selectedProperNoun === noun ? 'bg-[#9DC08B] border-[#9DC08B] font-medium' : 'bg-white border-gray-300'}`}
              >
                {noun}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-600">性格特征</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {personalityTraits.map((trait) => (
              <button
                key={trait}
                onClick={() => handleTraitToggle(trait)}
                className={`p-2 rounded-lg border transition-all duration-200 hover:bg-[#AEC9A0] hover:border-[#9DC08B]

                  ${selectedTraits.includes(trait) ? 'bg-[#9DC08B] border-[#9DC08B] font-medium' : 'bg-white border-gray-300'}`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-600">语气</h3>
          <div className="grid grid-cols-2 gap-2">
            {tones.map((tone) => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone)}
                className={`p-2 rounded-lg border transition-all duration-200 hover:bg-[#AEC9A0] hover:border-[#9DC08B]

                  ${selectedTone === tone ? 'bg-[#9DC08B] border-[#9DC08B] font-medium' : 'bg-white border-gray-300'}`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 flex justify-end border-t border-gray-200">
        <button 
          onClick={savePreferences}
          className="px-5 py-2 bg-[#9DC08B] hover:bg-[#AEC9A0] text-white rounded-lg shadow transition duration-200"
        >
          保存偏好
        </button>
      </div>
    </div>
  </div>
)}

      {/* <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-10">
        {[
          {icon: 'random', text: '随机'},
          {icon: 'sad', text: '悲伤'},
          {icon: 'dance', text: '跳舞'},
          {icon: 'happy', text: '快乐'},
          {icon: 'support', text: '支持'},
          {icon: 'love', text: '爱'}
        ].map((btn, index) => (
          <button
            key={index}
            onClick={() => playSpecificVideo(btn.icon)}
            className="flex items-center gap-2 px-4 py-2 bg-bg-transparent hover:bg-bg-secondary border border-border rounded-full shadow-sm transition-colors duration-normal"
          >

            {btn.text}
          </button>
        ))}
      </div> */}
      

      {emojisArray.map(emoji => (
        <div 
          key={emoji.id}
          className="z-[9999]"
          style={{
            position: 'fixed',
            left: `${emoji.left}%`,
            top: `${emoji.top}px`,
            fontSize: `${emoji.size}px`,
            opacity: Math.max(0, 1 - (emoji.top / window.innerHeight))
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
}

export default ChatPage;
