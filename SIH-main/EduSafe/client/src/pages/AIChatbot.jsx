import React, { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AIChatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi, I'm the Disaster Assistance Bot. Tell me your situation (e.g., flood, earthquake, fire), or use the quick actions below.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Disaster-focused intents
  const qaPairs = [
    {
      keywords: [
        "hi",
        "hii",
        "hiii",
        "hello",
        "helo",
        "hey",
        "heyy",
        "heiii",
        "greetings",
      ],
      question: "Basic greetings",
      answer: "Hello! I’m your Disaster Buddy. How can I help you today?",
    },
    {
      keywords: ["thanks", "thank you", "thx", "ty", "thanx", "tq", "thankuu"],
      question: "Gratitude",
      answer:
        "You’re welcome! Stay safe and let me know if you need more help.",
    },
    {
      keywords: [
        "who are you",
        "what are you",
        "abot you",
        "intrduce",
        "who r u",
      ],
      question: "Bot introduction",
      answer:
        "I’m EduSafe’s Disaster Buddy – your AI assistant to guide you in emergencies, safety tips, and resources.",
    },
    {
      keywords: [
        "help",
        "hlp",
        "support",
        "suport",
        "assist",
        "asist",
        "assistance",
      ],
      question: "General help",
      answer:
        "I can guide you with safety tips, emergency numbers, nearby shelters, and first aid. What do you need help with?",
    },
    {
      keywords: [
        "sos",
        "help",
        "urgent",
        "emergency",
        "emrgency",
        "emegency",
        "distress",
        "distres",
      ],
      question: "I need urgent help",
      answer:
        "If you are in immediate danger, call your local emergency number now (e.g., 112/911). Share your exact location. I can also list emergency contacts below.",
    },
    {
      keywords: [
        "earthquake",
        "erthquake",
        "earthqake",
        "quake",
        "quacke",
        "tremor",
        "aftershock",
        "aftershok",
      ],
      question: "What to do during an earthquake?",
      answer:
        "Earthquake safety: 1) Drop, Cover, and Hold On. 2) Stay away from windows. 3) If outdoors, move to open space. 4) After shaking stops, check for injuries and hazards, and expect aftershocks.",
    },
    {
      keywords: [
        "flood",
        "floood",
        "flod",
        "flooding",
        "floading",
        "water level",
        "flash flood",
        "flashflood",
      ],
      question: "How to stay safe in floods?",
      answer:
        "Flood safety: 1) Move to higher ground. 2) Avoid walking/driving through flood water. 3) Disconnect power if safe. 4) Prepare clean water and essential supplies. 5) Follow local alerts.",
    },
    {
      keywords: [
        "fire",
        "fir",
        "fyre",
        "wildfire",
        "wild fire",
        "smoke",
        "evacuate",
        "evacuat",
      ],
      question: "Fire safety tips",
      answer:
        "Fire safety: 1) Evacuate early if told. 2) Close doors behind you. 3) Stay low under smoke. 4) Use stairs, not elevators. 5) If trapped, seal doors and call emergency services.",
    },
    {
      keywords: [
        "cyclone",
        "cyclon",
        "hurricane",
        "huricane",
        "hurican",
        "typhoon",
        "tyfon",
        "storm",
        "strom",
        "winds",
        "wind",
      ],
      question: "Cyclone/hurricane safety",
      answer:
        "Cyclone safety: 1) Stay indoors away from windows. 2) Prepare go-bag (water, meds, docs, flashlight). 3) Unplug appliances. 4) Evacuate if ordered. 5) Avoid floodwaters after the storm.",
    },
    {
      keywords: [
        "landslide",
        "landslid",
        "land slied",
        "mudslide",
        "mudslid",
        "rockfall",
        "rock fal",
      ],
      question: "Landslide safety",
      answer:
        "Landslide safety: 1) Move away from slopes/valleys quickly. 2) Watch for signs like cracks or unusual sounds. 3) Stay alert to weather updates. 4) After a landslide, stay away from the slide area.",
    },
    {
      keywords: [
        "tsunami",
        "tsunam",
        "tidal wave",
        "tideal wav",
        "seismic sea wave",
        "sesmic wav",
      ],
      question: "Tsunami safety",
      answer:
        "Tsunami safety: 1) Move immediately to higher ground. 2) Stay away from the shore. 3) Listen to official alerts. 4) Don’t return until authorities declare it safe.",
    },
    {
      keywords: [
        "shelter",
        "sheltr",
        "sheltrs",
        "relief camp",
        "relif camp",
        "evacuation center",
        "evacuatn center",
        "nearest shelter",
        "near shlter",
      ],
      question: "Find nearby shelters",
      answer:
        "Check official municipal/state disaster portals for verified shelters. If you share your area/locality, I can suggest links to local relief resources and maps.",
    },
    {
      keywords: [
        "helpline",
        "helplin",
        "helthline",
        "hotline",
        "hotlin",
        "contact",
        "cntact",
        "emergency number",
        "emrgency numbr",
      ],
      question: "Emergency helplines",
      answer:
        "Common helplines: Emergency 112, Fire 101, Ambulance 102/108, Police 100. Check your local/state disaster management authority for location-specific numbers.",
    },
    {
      keywords: [
        "first aid",
        "frst aid",
        "frist aid",
        "injury",
        "inury",
        "bleeding",
        "bledding",
        "cpr",
        "c p r",
      ],
      question: "First aid basics",
      answer:
        "First aid: For bleeding—apply direct pressure and elevate if possible. For burns—cool with running water 20 min, do not apply creams. For CPR—call emergency services and begin chest compressions at 100–120/min.",
    },
    {
      keywords: [
        "report damage",
        "report dmg",
        "damage",
        "damge",
        "lost",
        "loost",
        "missing",
        "misng",
        "report incident",
        "incident",
      ],
      question: "How to report damage or missing person?",
      answer:
        "Use the Report Issue page to submit details with photos and location if possible. For missing persons, contact police and local disaster control room immediately; provide description, last seen, and contact info.",
    },
    {
      keywords: [
        "snake bite",
        "snakebite",
        "snaek bite",
        "snak bit",
        "cobra bite",
        "viper bite",
      ],
      question: "Snake bite first aid",
      answer:
        "Snake bite safety: 1) Keep the victim calm and still. 2) Do NOT try to suck the venom. 3) Immobilize the bitten limb, keep it lower than heart. 4) Seek immediate hospital care. 5) Note snake’s appearance if safe.",
    },
    {
      keywords: [
        "electrical hazard",
        "electric shock",
        "electrocuted",
        "shock",
        "current",
        "wire shock",
        "electrcal",
      ],
      question: "Electrical hazards safety",
      answer:
        "Electrical safety: 1) Don’t touch victim with bare hands—switch off power first. 2) Use non-conductive object to move wire. 3) If victim isn’t breathing, begin CPR after calling emergency. 4) Get medical help immediately.",
    },
    {
      keywords: [
        "sports injury",
        "sport injury",
        "sprain",
        "sprin",
        "fracture",
        "fractur",
        "muscle pull",
        "ankle twist",
      ],
      question: "Sports injury first aid",
      answer:
        "Sports injury care (R.I.C.E.): 1) Rest the injured part. 2) Ice it for 20 minutes. 3) Compress with bandage. 4) Elevate the limb. Seek medical help if severe or fracture suspected.",
    },
    {
      keywords: ["dog bite", "dogbit", "animal bite", "rabies", "dog attak"],
      question: "Dog/animal bite safety",
      answer:
        "Dog bite safety: 1) Wash wound with soap & water for 15 min. 2) Apply antiseptic. 3) Go to hospital for rabies vaccination. 4) Don’t ignore even small bites.",
    },
    {
      keywords: [
        "burn",
        "burns",
        "fire burn",
        "hot oil",
        "scald",
        "steam burn",
      ],
      question: "Burn first aid",
      answer:
        "Burn care: 1) Cool with running water 20 minutes. 2) Do not apply creams/oils. 3) Cover loosely with clean cloth. 4) For severe burns, seek hospital immediately.",
    },
    {
      keywords: [
        "drowning",
        "drwning",
        "near drowning",
        "water accident",
        "swim accident",
      ],
      question: "Drowning safety",
      answer:
        "Drowning first aid: 1) Call emergency immediately. 2) If safe, pull victim from water. 3) Check breathing—if not, start CPR. 4) Place unconscious breathing person on their side.",
    },
    {
      keywords: ["choking", "chok", "air block", "food stuck", "airway block"],
      question: "Choking first aid",
      answer:
        "Choking aid: 1) Encourage coughing. 2) If unable to breathe—perform 5 back blows, then 5 abdominal thrusts. 3) Call emergency if still blocked.",
    },
    {
      keywords: [
        "heatstroke",
        "heat stroke",
        "sun stroke",
        "heat stress",
        "overheat",
      ],
      question: "Heatstroke first aid",
      answer:
        "Heatstroke care: 1) Move victim to shade/cool place. 2) Loosen clothes. 3) Cool with wet cloths or fan. 4) Give sips of water if conscious. 5) Seek emergency care immediately.",
    },
    {
      keywords: [
        "faint",
        "fainting",
        "passed out",
        "unconscious",
        "unconcsious",
        "blackout",
      ],
      question: "Fainting safety",
      answer:
        "Fainting aid: 1) Lay person flat, raise legs slightly. 2) Loosen tight clothes. 3) Ensure fresh air. 4) If unconscious >1 min, call emergency.",
    },
    {
      keywords: [
        "poison",
        "poisoning",
        "toxic",
        "ate poison",
        "chemicals",
        "pesticide",
      ],
      question: "Poisoning safety",
      answer:
        "Poisoning care: 1) Do not induce vomiting unless told by doctor. 2) Identify substance. 3) Call poison helpline/emergency. 4) Keep container for hospital reference.",
    },
    {
      keywords: [
        "allergy",
        "allergic",
        "anaphylaxis",
        "bee sting",
        "insect bite",
        "allergy attack",
      ],
      question: "Allergic reaction safety",
      answer:
        "Allergy care: 1) Remove trigger if known. 2) For mild—give antihistamine. 3) For severe (trouble breathing, swelling)—use epinephrine auto-injector if available and call emergency.",
    },
    {
      keywords: [
        "road accident",
        "accident",
        "car crash",
        "bike crash",
        "road injry",
      ],
      question: "Road accident response",
      answer:
        "Road accident help: 1) Ensure your own safety before helping. 2) Call emergency services. 3) Don’t move victim unless danger nearby. 4) Control bleeding with pressure. 5) Keep them calm till help arrives.",
    },
  ];

  // Quick actions for disasters
  const quickQuestions = [
    "I need urgent help",
    "What to do during an earthquake?",
    "How to stay safe in floods?",
    "Fire safety tips",
    "Cyclone/hurricane safety",
    "Find nearby shelters",
    "Emergency helplines",
    "First aid basics",
  ];

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "") return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Find a response based on keywords
    const botResponse = findBotResponse(inputMessage);

    // Add bot response with a slight delay to simulate thinking
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }, 600);

    setInputMessage("");
  };

  // Handle clicking a quick question
  const handleQuickQuestion = (question) => {
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: question,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Find a response based on the question
    const botResponse = findBotResponse(question);

    // Add bot response with a slight delay
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }, 600);
  };

  // Find a response based on keywords in the user's message
  const findBotResponse = (userMessage) => {
    const lowercaseMessage = userMessage.toLowerCase();

    // Check if any keywords match
    for (const pair of qaPairs) {
      for (const keyword of pair.keywords) {
        if (lowercaseMessage.includes(keyword.toLowerCase())) {
          return pair.answer;
        }
      }

      // Also check if the message matches a predefined question
      if (lowercaseMessage === pair.question.toLowerCase()) {
        return pair.answer;
      }
    }

    // Default response if no match is found
    return "I'm not sure I understand. Could you rephrase your question or select one of the quick questions below?";
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-gray-50 to-gray-100 font-nunito">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 text-white p-3 md:p-5 flex items-center justify-between shadow-lg overflow-hidden sticky top-0 z-20">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 w-full h-full bg-white"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.3) 2px, transparent 2px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        <div className="flex items-center z-10">
          <div className="bg-white p-2 rounded-full shadow-lg mr-3 transform hover:rotate-12 transition-transform duration-300">
            <FaRobot className="text-2xl text-primary-700" />
          </div>
          <div>
            <h1 className="font-poppins font-bold text-lg md:text-xl tracking-wide">
              Disaster Assistance Bot
            </h1>
            <p className="text-xs md:text-sm text-blue-100 font-nunito">
              Online · Emergency info and guidance
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white text-primary-700 hover:bg-blue-50 rounded-full p-2 md:p-3 transition-all shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white z-10"
          aria-label="Return to Dashboard"
        >
          <FaArrowLeft className="text-lg" />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-5 bg-opacity-50 pb-28 md:pb-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } animate-fadeIn`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-3 md:p-4 shadow-md ${
                message.sender === "user"
                  ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-br-none transform hover:scale-[1.01] transition-transform"
                  : "bg-white text-gray-800 rounded-bl-none border-l-4 border-primary-500 transform hover:scale-[1.01] transition-transform"
              }`}
            >
              <div className="flex items-center mb-2">
                {message.sender === "bot" && (
                  <div className="bg-primary-100 p-1 rounded-full mr-2">
                    <FaRobot className="text-primary-700" />
                  </div>
                )}
                {message.sender === "user" && (
                  <div className="bg-primary-700 p-1 rounded-full mr-2">
                    <FaUser className="text-white" />
                  </div>
                )}
                <span className="font-poppins font-semibold">
                  {message.sender === "bot" ? "EduSafe AI" : "You"}
                </span>
              </div>
              <p className="leading-relaxed font-nunito">{message.text}</p>
              <div className="text-xs text-right mt-2 opacity-70 font-nunito">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - hidden on mobile */}
      <div className="hidden md:block bg-white md:p-4 border-t border-gray-200 shadow-inner md:static z-10">
        <div className="flex gap-2 justify-start pb-1">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-4 py-2 rounded-full text-sm whitespace-nowrap hover:from-primary-200 hover:to-primary-300 transition-all shadow-sm hover:shadow transform hover:scale-105 font-nunito"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency panel - visible on all sizes */}
      <div className="bg-white p-3 md:p-4 border-t border-gray-200 shadow-inner">
        <div className="text-sm text-gray-700 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center">
          <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full font-poppins font-semibold mr-3 shadow-sm">
            Emergency
          </div>
          <span className="font-nunito">
            Call 112/911 for life-threatening emergencies. Share your exact
            location.
          </span>
        </div>
      </div>

      {/* Message Input */}
      <div
        className="bg-white p-3 md:p-5 border-t shadow-lg sticky bottom-0 z-20"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <form
          onSubmit={handleSendMessage}
          className="flex items-center max-w-4xl mx-auto gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 border-2 border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm font-nunito"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-full p-3 md:p-3.5 hover:from-primary-600 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
          >
            <FaPaperPlane className="text-lg" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatbot;
