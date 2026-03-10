/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import "../styles/messages.css";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [banned, setBanned] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const bottomRef = useRef(null);

 

  // Get logged user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);
// -------------------------
// Update last_seen (presence heartbeat)
// -------------------------
useEffect(() => {
  if (!user) return;

  const updatePresence = async () => {
    await supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("user_id", user.id);
  };

  updatePresence();

  const interval = setInterval(updatePresence, 15000);

  return () => clearInterval(interval);
}, [user]);


  // -------------------------
  // Check ban status
  // -------------------------
  const checkBan = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_moderation")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (data && data.banned_until && new Date(data.banned_until) > new Date()) {
      setBanned(true);
    }
  }, [user]);

  useEffect(() => {
    checkBan();
  }, [checkBan]);

  // -------------------------
  // Load connections
  // -------------------------
  const loadConnections = useCallback(async () => {
    if (!user) return;
  
    const { data } = await supabase
      .from("connections")
      .select(`
        sender_id,
        receiver_id,
        sender:sender_id(name,domain,last_seen),
        receiver:receiver_id(name,domain,last_seen)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted");

      const isOnline = (lastSeen) => {
        if (!lastSeen) return false;
      
        const last = new Date(lastSeen + "Z").getTime();
        const now = Date.now();
      
        return now - last < 60000;
      };
      
      const users =
        data?.map((c) => {
          if (c.sender_id === user.id) {
            return {
              id: c.receiver_id,
              name: c.receiver?.name || "User",
              dept: c.receiver?.domain || "Dept",
              online: isOnline(c.receiver?.last_seen)
            };
          } else {
            return {
              id: c.sender_id,
              name: c.sender?.name || "User",
              dept: c.sender?.domain || "Dept",
              online: isOnline(c.sender?.last_seen)
            };
          }
        }) || [];
    // fetch latest message for each connection
    const updatedUsers = await Promise.all(
      users.map(async (u) => {
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("message, created_at")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
  
          return {
            ...u,
            lastMessage: lastMsg?.message || null,
            lastMessageTime: lastMsg?.created_at || null
          };
      })
    );
  
    setConnections(updatedUsers);
  }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // refresh online status every 4 sec
  useEffect(() => {
    if (!user) return;
  
    loadConnections(); // initial load
  
    const interval = setInterval(() => {
      loadConnections();
    }, 5000); // refresh every 5 seconds
  
    return () => clearInterval(interval);
  }, [user, loadConnections]);

  // -------------------------
  // Load messages
  // -------------------------
  const loadMessages = useCallback(async () => {
    if (!receiver || !user) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiver}),and(sender_id.eq.${receiver},receiver_id.eq.${user.id})`
      )
      .order("created_at");

    setMessages(data || []);
  }, [receiver, user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // -------------------------
  // Auto scroll
  // -------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -------------------------
  // Realtime messages
  // -------------------------
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;

          if (
            (msg.sender_id === user.id && msg.receiver_id === receiver) ||
            (msg.sender_id === receiver && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, receiver]);

  // -------------------------
  // Typing listener
  // -------------------------
  useEffect(() => {
    if (!user) return;

    const typingChannel = supabase
      .channel("typing-channel")
      .on("broadcast", { event: "typing" }, (payload) => {
        const { sender, receiver: target } = payload.payload;

        if (target === user.id) {
          setTypingUser(sender);

          setTimeout(() => {
            setTypingUser(null);
          }, 2000);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(typingChannel);
  }, [user]);

  // -------------------------
  // Send message
  // -------------------------
  const sendMessage = async () => {
    if (!text || !receiver || banned) return;

    await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiver,
        message: text,
      },
    ]);
    setTypingUser(null);
    setText("");
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedUser = connections.find((u) => u.id === receiver);

  return (
    <>
      <Navbar />

      <div className="chat-container">

        {/* LEFT SIDEBAR */}
        <div className="chat-sidebar">
          <h3>Messages</h3>

          {connections.map((u) => {
            
            return (
              <div
                key={u.id}
                className={`chat-user ${receiver === u.id ? "active" : ""}`}
                onClick={() => setReceiver(u.id)}
              >
                <div className="avatar">
                  {u.name[0]}
                  {u.online && <span className="online-dot"></span>}
                </div>
            
                <div className="chat-info">
            
                  {/* NAME + TIME ROW */}
                  <div className="name-row">
                    <span className="username">{u.name}</span>
            
                    <span className="msg-time">
                      {u.lastMessageTime
                        ? new Date(u.lastMessageTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
            
                  {/* LAST MESSAGE */}
                  <div className="last-msg">
                    {typingUser === u.id ? (
                      <span className="typing">Typing...</span>
                    ) : u.lastMessage ? (
                      u.lastMessage
                    ) : (
                      "Tap to chat"
                    )}
                  </div>
            
                </div>
              </div>
            );
          })}
        </div>

        {/* CHAT AREA */}
        <div className="chat-main">

          {!receiver && (
            <div className="empty-chat">
              Select a user to start chatting
            </div>
          )}

          {receiver && (
            <>
              <div className="chat-header">
                {selectedUser?.name}
              </div>

              <div className="chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.sender_id === user?.id
                        ? "message me"
                        : "message other"
                    }
                  >
                    <div className="msg-text">{msg.message}</div>
                    <div className="time">{formatTime(msg.created_at)}</div>
                  </div>
                ))}
                  {typingUser === receiver && (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
                <div ref={bottomRef}></div>
              </div>

              {!banned ? (
                <div className="chat-input">
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);

                      supabase.channel("typing-channel").send({
                        type: "broadcast",
                        event: "typing",
                        payload: {
                          sender: user.id,
                          receiver: receiver
                        }
                      });
                    }}
                    placeholder="Type a message..."
                    rows="2"
                  />
                  <button onClick={sendMessage}>➤</button>
                </div>
              ) : (
                <div className="banned">
                  Messaging disabled due to abusive behaviour
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}