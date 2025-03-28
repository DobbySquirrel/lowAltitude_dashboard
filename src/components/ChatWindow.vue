<template>
  <div class="chat-window">
    <!-- Left sidebar - user list -->
    <div class="user-list">
      <div class="user-item" :class="{ active: selectedTab === 'user' }" @click="selectedTab = 'user'">
        <i class="el-icon-user"></i> Users
      </div>
      <div class="user-item" :class="{ active: selectedTab === 'group' }" @click="selectedTab = 'group'">
        <i class="el-icon-chat-dot-round"></i> Groups
      </div>
    </div>

    <!-- Right chat area -->
    <div class="chat-area">
      <!-- Chat header -->
      <div class="chat-header">
        <h3>{{ selectedTab === 'user' ? 'User Chat' : 'Group Chat' }}</h3>
      </div>
      
      <!-- Messages display area -->
      <div class="messages" ref="messageContainer">
        <div v-for="(message, index) in messages" :key="index" class="message" :class="message.type">
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ message.time }}</div>
        </div>
      </div>

      <!-- Input area -->
      <div class="input-area">
        <el-input
          v-model="newMessage"
          type="textarea"
          :rows="3"
          placeholder="Type a message..."
          @keyup.enter.native="sendMessage"
        />
        <el-button type="primary" @click="sendMessage">Send</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { messageHandler } from '../utils/messageHandler'
import { messageReceiver } from '../utils/messageReceiver'

export default {
  name: 'ChatWindow',
  setup() {
    const selectedTab = ref('user')
    const newMessage = ref('')
    const messages = messageReceiver.chatMessages
    const messageContainer = ref(null)

    const sendMessage = () => {
      if (!newMessage.value.trim()) return

      // 使用消息处理器发送消息
      messageHandler.sendChatMessage(newMessage.value);

      messages.value.push({
        content: newMessage.value,
        time: new Date().toLocaleTimeString(),
        type: 'sent'
      })

      // Simulate reply
      setTimeout(() => {
        messages.value.push({
          content: 'This is an automated reply',
          time: new Date().toLocaleTimeString(),
          type: 'received'
        })
      }, 1000)

      newMessage.value = ''
      
      // Scroll to bottom
      setTimeout(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      }, 100)
    }

    return {
      selectedTab,
      newMessage,
      messages,
      sendMessage,
      messageContainer
    }
  }
}
</script>

<style scoped>
.chat-window {
  display: flex;
  height: 70vh;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 0;
}

.user-list {
  width: 240px;
  background: #f8f9fa;
  padding: 15px;
  border-right: 1px solid #eaeaea;
}

.user-item {
  padding: 12px 15px;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.user-item:hover {
  background: #e9ecef;
}

.user-item.active {
  background: #e9ecef;
  color: #3498db;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eaeaea;
  background: #f8f9fa;
}

.chat-header h3 {
  margin: 0;
  font-weight: 500;
  color: #333;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #ffffff;
}

.message {
  margin-bottom: 15px;
  max-width: 70%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.sent {
  margin-left: auto;
}

.message.received {
  margin-right: auto;
}

.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  background: #f0f2f5;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message.sent .message-content {
  background: #3498db;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  text-align: right;
}

.input-area {
  margin: 15px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #eaeaea;
  padding-top: 15px;
}

.input-area .el-textarea__inner {
  border-radius: 20px;
  padding: 10px 15px;
  resize: none;
}

.input-area .el-button {
  align-self: flex-end;
  border-radius: 20px;
  padding: 10px 20px;
  height: auto;
}
</style> 