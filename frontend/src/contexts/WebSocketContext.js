import React, { createContext, useEffect, useState } from "react";

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Establish WebSocket connection
        const ws = new WebSocket("ws://localhost:5005"); 
        setSocket(ws);

        // Cleanup on unmount
        return () => {
            ws.close();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={socket}>
            {children}
        </WebSocketContext.Provider>
    );
};