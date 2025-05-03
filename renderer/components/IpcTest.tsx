import { useEffect, useState } from 'react';

export default function IpcTest() {
      const [message, setMessage] = useState('No message found')
    
      useEffect(() => {
        window.ipc.on('message', (message: string) => {
          setMessage(message)
        })
      }, [])

  return (
    <div>
    <button
      onClick={() => {
        window.ipc.send('message', 'Hello')
      }}
    >
      Test IPC
    </button>
    <p>{message}</p>
  </div>
  )
}
