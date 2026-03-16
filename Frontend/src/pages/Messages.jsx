/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import "../styles/messages.css";
import { Check, CheckCheck } from "lucide-react";
import { MdReply, MdEdit, MdDelete } from "react-icons/md";
export default function Messages() {
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [banned, setBanned] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [menuDirection, setMenuDirection] = useState("up");
  const bottomRef = useRef(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [replyMsg, setReplyMsg] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const menuTimer = useRef(null);
 
  const chatRef = useRef(null);
const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
const [isAtBottom, setIsAtBottom] = useState(true);
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
          .select("message, created_at, sender_id, delivered, seen")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
    
        // unread messages from that user
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", u.id)
          .eq("receiver_id", user.id)
          .eq("seen", false);
    
        return {
          ...u,
          lastMessage: lastMsg?.message || null,
          lastMessageTime: lastMsg?.created_at || null,
          lastMessageSender: lastMsg?.sender_id,
          lastDelivered: lastMsg?.delivered,
          lastSeen: lastMsg?.seen,
          unreadCount: count || 0
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
      .select(`
        *,
        message_reactions (
          id,
          reaction,
          user_id
        ),
        reply_to_message:reply_to (
          id,
          message
        )
      `)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiver}),and(sender_id.eq.${receiver},receiver_id.eq.${user.id})`
      )
      .order("created_at");
  
    setMessages(data || []);
  
    // STEP 2: mark messages as delivered
    await supabase
    .from("messages")
    .update({
      delivered: true,
      seen: true
    })
    .eq("receiver_id", user.id)
    .eq("sender_id", receiver);
    
  }, [receiver, user]);
  useEffect(() => {
 
    loadMessages();
  }, [loadMessages]);
 // Mark messages as seen when chat is opened
 useEffect(() => {
  if (!receiver || !user) return;

  const markSeen = async () => {
    await supabase
      .from("messages")
      .update({ seen: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", receiver)
      .eq("seen", false);
  };

  markSeen();
}, [receiver, user]);
  // -------------------------
  // Auto scroll
  // -------------------------
  useEffect(() => {

    if (!chatRef.current) return;
  
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowNewMsgBtn(true);
    }
  
  }, [messages]);

  useEffect(() => {
    const container = chatRef.current;
  
    const handleScroll = () => {
      if (!container) return;
  
      const threshold = 100;
  
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold;
  
      setIsAtBottom(atBottom);
  
      if (atBottom) {
        setShowNewMsgBtn(false);
      }
    };
  
    container?.addEventListener("scroll", handleScroll);
  
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);
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


//  HERE ?
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel("message-status")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const updated = payload.new;

        // only update if message belongs to this chat
        if (
          (updated.sender_id === user.id && updated.receiver_id === receiver) ||
          (updated.sender_id === receiver && updated.receiver_id === user.id)
        ) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updated.id ? { ...msg, ...updated } : msg
            )
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user, receiver]);



useEffect(() => {
  const channel = supabase
    .channel("reactions")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "message_reactions"
      },
      () => {
        loadMessages();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [loadMessages]);
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
    if (!text.trim() || !receiver || banned) return;

    await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiver,
        message: text,
        reply_to: replyMsg ? replyMsg.id : null
      }
      ]);
    setReplyMsg(null);
    setTypingUser(null);
    setText("");
  };

  // Delete Message
  const deleteMessage = async (id) => {

    const el = document.getElementById(`msg-${id}`);
    if(el){
      el.classList.add("deleting");
    }
  
    setTimeout(async () => {
  
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);
  
      if(!error){
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
      }
  
    },200);
  
  };
  // Edit Message 

  const startEdit = (msg) => {
    setEditingMsg(msg);
    setText(msg.message);
  };
  const handleSubmit = async () => {

    console.log("handleSubmit triggered");
    console.log("Current text:", text);
    console.log("Editing message:", editingMsg);
  
    if (!text.trim()) {
      console.log("Empty text - nothing to send");
      return;
    }
  
    if (editingMsg?.id) {
  
      console.log("Updating message ID:", editingMsg.id);
  
      const { data, error } = await supabase
        .from("messages")
        .update({
          message: text,
          edited: true
        })
        .eq("id", editingMsg.id)
        .eq("sender_id", user.id)
        .select();
  
      console.log("Supabase update result:", data);
  
      if (error) {
        console.log("Update error:", error);
        return;
      }
  
      console.log("Local state updating");
  
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMsg.id
            ? { ...m, message: text, edited: true }
            : m
        )
      );
  
      setEditingMsg(null);
      setText("");
  
      console.log("Edit finished");
  
    } else {
  
      console.log("Sending new message");
      sendMessage();
  
    }
  };
  
  const reactToMessage = async (messageId, emoji) => {
    if (!user) return;
  
    const message = messages.find((m) => m.id === messageId);
  
    const existingReaction = message?.message_reactions?.find(
      (r) => r.user_id === user.id
    );
  
    // If user clicked same emoji again → remove reaction
    if (existingReaction && existingReaction.reaction === emoji) {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id);
  
      if (!error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, message_reactions: [] }
              : msg
          )
        );
      }
  
      return;
    }
  
    // Otherwise add / change reaction
    const { error } = await supabase
      .from("message_reactions")
      .upsert(
        {
          message_id: messageId,
          user_id: user.id,
          reaction: emoji,
        },
        { onConflict: "message_id,user_id" }
      );
  
    if (!error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                message_reactions: [
                  {
                    reaction: emoji,
                    user_id: user.id,
                  },
                ],
              }
            : msg
        )
      );
    }
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
                <div className="avatars">
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

{/* LAST MESSAGE ROW */}
<div className="last-msg-row">

  <div className="last-msg">

    {typingUser === u.id ? (
      <span className="typing">Typing...</span>
    ) : (
      <>
        {u.lastMessageSender === user?.id && (
          <span
            className={`ticks-small ${
              u.lastSeen ? "seen" : u.lastDelivered ? "delivered" : "sent"
            }`}
          >
            {u.lastSeen ? (
              <CheckCheck size={14} />
            ) : u.lastDelivered ? (
              <CheckCheck size={14} />
            ) : (
              <Check size={14} />
            )}
          </span>
        )}

              {u.lastMessage ? u.lastMessage : "Tap to chat"}
            </>
          )}

        </div>

      {/* UNREAD BADGE */}
      {u.unreadCount > 0 && (
        <span className="unread-badge">
          {u.unreadCount > 5 ? "5+" : u.unreadCount}
        </span>
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

              <div className="chat-messages" ref={chatRef}>
                  {messages.map((msg) => {

                    const userReaction = msg.message_reactions?.find(
                      (r) => r.user_id === user?.id
                    );

                    return (
                      <div
                        id={`msg-${msg.id}`}
                        key={msg.id}
                        className={
                          msg.sender_id === user?.id
                            ? "message me"
                            : "message other"
                        }
                        style={{ position: "relative" }}
                      >
                    <div
                      className="msg-row reaction-wrapper"
                      onMouseEnter={(e) => {
                        if (menuTimer.current) {
                          clearTimeout(menuTimer.current);
                        }

                        const rect = e.currentTarget.getBoundingClientRect();
                        const chatContainer = document.querySelector(".chat-messages");
                        const containerRect = chatContainer.getBoundingClientRect();

                        const spaceBelow = containerRect.bottom - rect.bottom;
                        const menuHeight = 140;

                        if (spaceBelow < menuHeight) {
                          setMenuDirection("up");
                        } else {
                          setMenuDirection("down");
                        }

                        setHoveredMsg(msg.id);
                      }}
                      onMouseLeave={() => {
                        menuTimer.current = setTimeout(() => {
                          setHoveredMsg(null);
                        }, 400);
                      }}
                    >

                    {/* HOVER MENU */}
                    {hoveredMsg === msg.id && (
                      <div
                        className={`message-menu ${menuDirection}`}
                        onMouseEnter={() => {
                          if (menuTimer.current) {
                            clearTimeout(menuTimer.current);
                          }
                          setHoveredMsg(msg.id);
                        }}
                        onMouseLeave={() => {
                          menuTimer.current = setTimeout(() => {
                            setHoveredMsg(null);
                          }, 400);
                        }}
                      >

                        {/* REACTIONS ROW */}
                        <div className="menu-reactions">
                          {["👍","❤️","😂","😮","😢","🔥"].map((emoji) => (
                            <span
                              key={emoji}
                              className={`reaction-emoji ${
                                userReaction?.reaction === emoji ? "active-reaction" : ""
                              }`}
                              onClick={() => reactToMessage(msg.id, emoji)}
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>

                        <div className="menu-divider"></div>

                        <button
                          className="menu-item"
                          onClick={() => setReplyMsg(msg)}
                        >
                          <MdReply size={18} />
                          Reply
                        </button>

                        {msg.sender_id === user?.id && (
                          <button
                            className="menu-item"
                            onClick={() => startEdit(msg)}
                          >
                            <MdEdit size={18} />
                            Edit
                          </button>
                        )}

                        {msg.sender_id === user?.id && (
                          <button
                            className="menu-item delete"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <MdDelete size={18} />
                            Delete
                          </button>
                        )}

                      </div>
                    )}

                      {/* REPLY PREVIEW (NEW) */}
                      {msg.reply_to_message && (
                            <div
                            className="reply-bubble"
                            onClick={() => {
                              const el = document.getElementById(`msg-${msg.reply_to}`);
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                          
                                el.classList.add("highlight-msg");
                          
                                setTimeout(() => {
                                  el.classList.remove("highlight-msg");
                                }, 1500);
                              }
                            }}
                          >
                          <div className="reply-sender">
                            {msg.reply_to_message.sender_id === user?.id ? "You" : selectedUser?.name}
                          </div>

                          <div className="reply-msg-text">
                            {msg.reply_to_message.message}
                          </div>
                        </div>
                      )}

                  {/* MESSAGE TEXT */}
                  <span className="msg-text">{msg.message}
                  {msg.edited && (
                      <span className="edited-label"> edited</span>
                    )}
                  </span>

                  {/* TIME + TICKS */}
                  <span className="msg-info">
                    <span className="time">{formatTime(msg.created_at)}</span>

                    {msg.sender_id === user?.id && (
                      <span
                        className={`ticks ${
                          msg.seen ? "seen" : msg.delivered ? "delivered" : "sent"
                        }`}
                      >
                        {msg.seen ? (
                          <CheckCheck size={16} />
                        ) : msg.delivered ? (
                          <CheckCheck size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                      </span>
                    )}
                  </span>
                        </div>

                        {/* SHOW REACTION ON MESSAGE */}
                        {msg.message_reactions?.length > 0 && (
                          <div
                            className={`reaction-badge ${
                              msg.sender_id === user?.id ? "my-reaction" : "other-reaction"
                            }`}
                          >
                            {msg.message_reactions[0].reaction}
                          </div>
                        )}

                      </div>
                    );

                  })}

                  {typingUser === receiver && (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}

                  <div ref={bottomRef}></div>
                </div>
               {/* ⭐ ADD BUTTON HERE */}
                {showNewMsgBtn && (
                  <button
                    className="new-msg-btn"
                    onClick={() => {
                      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                      setShowNewMsgBtn(false);
                    }}
                  >
                    ↓ Jump to latest
                  </button>
                )}

              {!banned ? (
                
                <div className="chat-input">

              {replyMsg && (
                <div className="reply-preview-bar">

                  <div className="reply-left-bar"></div>

                  <div className="reply-content">
                    <span className="reply-name">
                      {replyMsg.sender_id === user?.id ? "You" : selectedUser?.name}
                    </span>

                    <span className="reply-text">
                      {replyMsg.message}
                    </span>
                  </div>

                  <button
                    className="reply-close"
                    onClick={() => setReplyMsg(null)}
                  >
                    ✕
                  </button>

                </div>
              )}
              {editingMsg && (
                <div className="edit-preview-bar">

                  <div className="reply-left-bar"></div>

                  <div className="reply-content">
                    <span className="reply-name">
                      Editing message
                    </span>

                    <span className="reply-text">
                      {editingMsg.message}
                    </span>
                  </div>

                  <button
                    className="reply-close"
                    onClick={() => {
                      setEditingMsg(null);
                      setText("");
                    }}
                  >
                    ✕
                  </button>

                </div>
              )}

              <div className="input-row">

              
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                
                  if (e.key === "Escape") {
                    setEditingMsg(null);
                    setText("");
                  }
                }}
                placeholder={editingMsg ? "Edit message..." : "Type a message..."}
                rows="2"
              />
                
                            
                </div>
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