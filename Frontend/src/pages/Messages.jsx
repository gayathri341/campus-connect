import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [receiverId, setReceiverId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Get logged in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();
  }, []);

  // Fetch chat history
  const loadMessages = useCallback(async () => {
    if (!user || !receiverId) return;
  
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),
         and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
  
    setMessages(data || []);
  }, [user, receiverId]);

  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages();
  }, [user, receiverId, loadMessages]);

  // Realtime listener
  useEffect(() => {
    if (!user) return; 
    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Send message
  const sendMessage = async () => {
    if (!text || !receiverId) return;

    await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiverId,
        message: text,
      },
    ]);

    setText("");
  };

  return (
    <>
      <Navbar />

      <div style={{ padding: "2rem" }}>
        <h2>Messages</h2>

        <input
          placeholder="Receiver User ID"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          style={{ width: "300px", marginBottom: "1rem" }}
        />

        <div
          style={{
            border: "1px solid gray",
            height: "300px",
            overflowY: "scroll",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          {messages.map((msg) => (
            <div key={msg.id}>
              <b>{msg.sender_id === user?.id ? "Me" : "Them"}:</b>{" "}
              {msg.message}
            </div>
          ))}
        </div>

        <input
          placeholder="Type message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "300px" }}
        />

        <button onClick={sendMessage} style={{ marginLeft: "10px" }}>
          Send
        </button>
      </div>
    </>
  );
}