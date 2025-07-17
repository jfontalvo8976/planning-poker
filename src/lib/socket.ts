import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export interface User {
  id: string
  name: string
  avatar?: string
  role: 'moderator' | 'participant' | 'spectator'
  canVote: boolean // Para que el moderador pueda elegir si votar o no
}

export interface Vote {
  userId: string
  value: string | null
  hasVoted: boolean
}

export interface PokerRoom {
  id: string
  name: string
  users: User[]
  votes: Record<string, Vote>
  isVotingComplete: boolean
  showVotes: boolean
  isRevealing: boolean
  votingValues: string[]
  createdAt: Date
  moderators: string[] // Array de IDs de moderadores
  creatorId: string // ID del creador original de la sala
}

export const pokersRooms: Record<string, PokerRoom> = {}

export const getDefaultVotingValues = () => [
  '0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'
]
