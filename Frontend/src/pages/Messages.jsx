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
  // Set user ONLINE
  // -------------------------
  useEffect(() => {
    if (!user) return;

    const setOnline = async () => {
      await supabase
        .from("profiles")
        .update({ online: true })
        .eq("user_id", user.id);
    };

    setOnline();
  }, [user]);

  // -------------------------
  // Set OFFLINE when leaving
  // -------------------------
  useEffect(() => {
    const setOffline = async () => {
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ online: false })
        .eq("user_id", user.id);
    };

    window.addEventListener("pagehide", setOffline);

    return () => {
      window.removeEventListener("pagehide", setOffline);
    };
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
      .single();

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
        sender:sender_id(name,domain,online),
        receiver:receiver_id(name,domain,online)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted");

    const users =
      data?.map((c) => {
        if (c.sender_id === user.id) {
          return {
            id: c.receiver_id,
            name: c.receiver?.name || "User",
            dept: c.receiver?.domain || "Dept",
            online: c.receiver?.online || false
          };
        } else {
          return {
            id: c.sender_id,
            name: c.sender?.name || "User",
            dept: c.sender?.domain || "Dept",
            online: c.sender?.online || false
          };
        }
      }) || [];

    setConnections(users);
  }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // refresh online status every 4 sec
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadConnections();
    }, 4000);

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

          {connections.map((u) => (
            <div
              key={u.id}
              className={`chat-user ${receiver === u.id ? "active" : ""}`}
              onClick={() => setReceiver(u.id)}
            >
              <div className="avatar">
                {u.name[0]}
                {u.online && <span className="online-dot"></span>}
              </div>

              <div>
                <div className="username">{u.name}</div>

                <div className="last-msg">
                  {typingUser === u.id ? (
                    <span className="typing">Typing...</span>
                  ) : (
                    messages
                      .filter(
                        (m) =>
                          (m.sender_id === user?.id && m.receiver_id === u.id) ||
                          (m.sender_id === u.id && m.receiver_id === user?.id)
                      )
                      .slice(-1)[0]?.message || "Tap to chat"
                  )}
                </div>
              </div>
            </div>
          ))}
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