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
  // STEP 2: Set user ONLINE
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
  // STEP 3: Set OFFLINE when leaving
  // -------------------------
  useEffect(() => {
    const setOffline = async () => {
      if (!user) return;
  
      await supabase
        .from("profiles")
        .update({ online: false })
        .eq("user_id", user.id);
    };
  
    const handleVisibility = () => {
      if (document.hidden) {
        setOffline();
      }
    };
  
    window.addEventListener("beforeunload", setOffline);
    document.addEventListener("visibilitychange", handleVisibility);
  
    return () => {
      window.removeEventListener("beforeunload", setOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  // Check ban status
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
    // eslint-disable-next-line
    checkBan();
  }, [checkBan]);

  // -------------------------
  // STEP 4: Load connections WITH ONLINE
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
    // eslint-disable-next-line
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    if (!user) return;
  
    const interval = setInterval(() => {
      loadConnections();
    }, 4000); // every 4 seconds
  
    return () => clearInterval(interval);
  }, [user, loadConnections]);

  // Load messages
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
    // eslint-disable-next-line
    loadMessages();
  }, [loadMessages]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime messages
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

  // Send message
  const sendMessage = async () => {
    if (!text || !receiver || banned) return;

    await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiver,
        message: text,
      },
    ]);

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
                <div className="dept">{u.dept}</div>
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

                <div ref={bottomRef}></div>
              </div>

              {!banned ? (
                <div className="chat-input">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
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