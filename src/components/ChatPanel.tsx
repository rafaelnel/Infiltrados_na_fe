import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, Users, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, Player } from '../types/game';
import { sounds } from '../utils/audio';

interface Props {
  messages: ChatMessage[];
  currentPlayer: Player;
  onSendMessage: (text: string, channel: 'PUBLIC' | 'SOLDIERS') => void;
  disabled?: boolean;
}

export const ChatPanel: React.FC<Props> = ({
  messages,
  currentPlayer,
  onSendMessage,
  disabled = false,
}) => {
  const [activeChannel, setActiveChannel] = useState<'PUBLIC' | 'SOLDIERS'>('PUBLIC');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSoldier = currentPlayer.team === 'SOLDADOS';

  const filteredMessages = messages.filter(m => {
    if (m.channel === 'PUBLIC' || m.channel === 'SYSTEM') return true;
    if (m.channel === 'SOLDIERS') return isSoldier;
    return false;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || disabled) return;
    sounds.playClick();
    onSendMessage(inputText.trim(), activeChannel);
    setInputText('');
  };

  const handleQuickPhrase = (phrase: string) => {
    sounds.playClick();
    onSendMessage(phrase, activeChannel);
  };

  const quickPhrases = [
    'Eu sou uma ovelha inocente!',
    'Acho muito suspeito o comportamento...',
    'Irmãos, prestem atenção nas contradições!',
    'Quem o Evangelista abençoou ontem?',
    'Vamos manter a união do rebanho.',
  ];

  return (
    <div className="flex flex-col h-full border-2 border-black rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* Channel Switcher */}
      <div className="flex border-b-2 border-black bg-neutral-100">
        <button
          onClick={() => setActiveChannel('PUBLIC')}
          className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
            activeChannel === 'PUBLIC' ? 'bg-white text-black border-b-2 border-black font-black' : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Users size={12} />
          <span>Assembleia Pública</span>
        </button>

        {isSoldier && (
          <button
            onClick={() => setActiveChannel('SOLDIERS')}
            className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              activeChannel === 'SOLDIERS' ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
            }`}
          >
            <Shield size={12} />
            <span>Covil dos Soldados 🗡️</span>
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs font-mono max-h-48 sm:max-h-56">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-[10px]">
            Nenhuma mensagem na congregação ainda.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredMessages.map(msg => {
              const isMe = msg.senderId === currentPlayer.id;
              const isSystem = msg.senderId === 'SYSTEM';

              if (isSystem) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center py-1"
                  >
                    <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-300 inline-block shadow-2xs">
                      {msg.text}
                    </span>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] text-neutral-500 font-bold px-1 mb-0.5">
                    {msg.senderName} {isMe ? '(Você)' : ''}
                    {msg.channel === 'SOLDIERS' && ' [Lobo]'}
                  </span>
                  <div
                    className={`p-2 rounded-xl max-w-[85%] border leading-tight shadow-2xs transition-shadow ${
                      isMe
                        ? msg.channel === 'SOLDIERS'
                          ? 'bg-black text-white border-black rounded-tr-none'
                          : 'bg-neutral-900 text-white border-black rounded-tr-none'
                        : msg.channel === 'SOLDIERS'
                        ? 'bg-red-50 text-red-950 border-red-900/30 rounded-tl-none'
                        : 'bg-neutral-100 text-black border-neutral-300 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Phrases */}
      <div className="px-2 py-1 bg-neutral-50 border-t border-neutral-200 overflow-x-auto no-scrollbar flex gap-1.5">
        {quickPhrases.map((phrase, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => handleQuickPhrase(phrase)}
            className="whitespace-nowrap px-2 py-0.5 rounded-full border border-black/40 text-[9px] font-mono text-black hover:bg-black hover:text-white transition-colors bg-white shrink-0"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex border-t-2 border-black p-1.5 bg-white">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={disabled}
          placeholder={
            disabled
              ? 'Chat desabilitado nesta fase...'
              : activeChannel === 'SOLDIERS'
              ? 'Conspirar com os Soldados...'
              : 'Falar com a assembleia...'
          }
          className="flex-1 px-3 py-1.5 text-xs font-mono border-0 focus:outline-none focus:ring-0 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={disabled || !inputText.trim()}
          className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
