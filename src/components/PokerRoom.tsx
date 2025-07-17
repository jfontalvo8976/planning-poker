'use client'

import { PokerRoom } from '../lib/socket'
import RoomHeader from './RoomHeader'
import ModeratorPanel from './ModeratorPanel'
import UserList from './UserList'
import VotingCards from './VotingCards'
import VotingStats from './VotingStats'
import RevealAnimation from './RevealAnimation'

interface PokerRoomComponentProps {
  room: PokerRoom
  currentUser: string
  roomId: string
  onVote: (value: string) => void
  onRevealVotes: () => void
  onResetVoting: () => void
  onToggleModeratorVoting: () => void
  onUpdateVotingValues: (values: string[]) => void
  onPromoteToModerator: (userId: string) => void
  onDemoteFromModerator: (userId: string) => void
  onEndRoom: () => void
}

export default function PokerRoomComponent({
  room,
  currentUser,
  roomId,
  onVote,
  onRevealVotes,
  onResetVoting,
  onToggleModeratorVoting,
  onUpdateVotingValues,
  onPromoteToModerator,
  onDemoteFromModerator,
  onEndRoom,
}: PokerRoomComponentProps) {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden transition-all duration-500">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full -translate-x-48 -translate-y-48 blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full translate-x-48 translate-y-48 blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      {/* Room Header - Fixed Nav */}
      <RoomHeader room={room} roomId={roomId} currentUser={currentUser} onEndRoom={onEndRoom} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 relative z-10 pt-20 lg:pt-24">   {/* h-16 + p-4 = pt-20, lg:h-20 + lg:p-6 = lg:pt-24 */}

        {/* Moderator Panel */}
        <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
          <ModeratorPanel
            room={room}
            currentUser={currentUser}
            onRevealVotes={onRevealVotes}
            onResetVoting={onResetVoting}
            onToggleModeratorVoting={onToggleModeratorVoting}
            onUpdateVotingValues={onUpdateVotingValues}
            onPromoteToModerator={onPromoteToModerator}
          />
        </div>

        {/* Reveal Animation */}
        {room.isRevealing && (
          <div className="animate-scale-in">
            <RevealAnimation
              isRevealing={room.isRevealing}
              onComplete={() => {}}
              votingValues={room.votingValues}
              votes={room.votes}
            />
          </div>
        )}

        {/* Voting Results */}
        {room.showVotes && (
          <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <VotingStats room={room} />
          </div>
        )}

        {/* Voting Cards */}
        {!room.showVotes && (
          <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <VotingCards
              room={room}
              currentUser={currentUser}
              onVote={onVote}
            />
          </div>
        )}

        {/* User List */}
        <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
          <UserList
            room={room}
            currentUser={currentUser}
            onPromoteToModerator={onPromoteToModerator}
            onDemoteFromModerator={onDemoteFromModerator}
          />
        </div>
      </div>
    </div>
  )
}
