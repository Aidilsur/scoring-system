'use client'

import React, { useState } from 'react'
import {
  Users,
  Swords,
  ChevronDown,
  ChevronUp,
  AtSign,
  Phone,
} from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { DrawnGroupDetail } from '@/hooks/useDrawQuery'
import { Match } from '@/types/domain'

export interface DrawGroupsViewProps {
  groups: DrawnGroupDetail[]
  matches: Match[]
}

export function DrawGroupsView({ groups, matches }: DrawGroupsViewProps) {
  const [isMatchesExpanded, setIsMatchesExpanded] = useState<Record<string, boolean>>({})

  if (groups.length === 0) {
    return (
      <Card variant="bordered" className="text-center py-12">
        <div
          className="w-12 h-12 mx-auto rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3"
        >
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-200">
          Belum Ada Drawing Grup
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Klik tombol &quot;Generate Draw&quot; di atas untuk mengacak tim confirmed
          dan membuat grup beserta jadwal pertandingannya.
        </p>
      </Card>
    )
  }

  const toggleMatches = (groupId: string) => {
    setIsMatchesExpanded((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">
            Hasil Pembagian Grup
          </h2>
          <p className="text-xs text-zinc-400">
            Daftar tim hasil pengacakan dan jadwal round robin yang terbentuk.
          </p>
        </div>
        <Badge variant="neutral">{groups.length} Grup Terbentuk</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group, groupIdx) => {
          // Filter match untuk grup ini
          const groupMatches = matches.filter((m) => m.group_id === group.id)
          const isExpanded = Boolean(isMatchesExpanded[group.id])

          return (
            <Card
              key={group.id || `group-${groupIdx}`}
              variant="elevated"
              className="space-y-4"
            >
              {/* Group Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl bg-lime-400/15 border border-lime-400/30 text-lime-400 flex items-center justify-center font-bold text-sm"
                  >
                    {String.fromCharCode(65 + groupIdx)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wide">
                      {group.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      {group.teams.length} Tim Peserta
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  {group.teams.length} Tim
                </Badge>
              </div>

              {/* Team List */}
              <div className="space-y-2">
                {group.teams.map((team, teamIdx) => (
                  <div
                    key={team.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 hover:border-lime-400/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 font-mono flex items-center justify-center text-xs font-bold shrink-0"
                      >
                        {teamIdx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {team.player1_name} &amp; {team.player2_name}
                        </p>
                        <div
                          className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5 font-mono"
                        >
                          <span className="flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            {team.phone_number}
                          </span>
                          {team.instagram_handle && (
                            <span className="flex items-center gap-1 truncate text-zinc-400">
                              <AtSign className="w-3 h-3 text-zinc-500" />
                              @{team.instagram_handle.replace(/^@/, '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Round Robin Matches Toggle */}
              {groupMatches.length > 0 && (
                <div className="pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => toggleMatches(group.id)}
                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white py-1.5 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-lime-400" />
                      Jadwal Round Robin ({groupMatches.length} Pertandingan)
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Matches List Accordion Content */}
                  {isExpanded && (
                    <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                      {groupMatches.map((m, mIdx) => {
                        const teamA = m.team_a
                        const teamB = m.team_b

                        return (
                          <div
                            key={m.id || `match-${mIdx}`}
                            className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono text-zinc-500">
                                #{mIdx + 1}
                              </span>
                              <div className="truncate">
                                <span className="font-semibold text-white">
                                  {teamA
                                    ? `${teamA.player1_name} / ${teamA.player2_name}`
                                    : 'Team A'}
                                </span>
                                <span className="mx-1.5 font-bold text-lime-400">
                                  vs
                                </span>
                                <span className="font-semibold text-white">
                                  {teamB
                                    ? `${teamB.player1_name} / ${teamB.player2_name}`
                                    : 'Team B'}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant={
                                m.status === 'live'
                                  ? 'success'
                                  : m.status === 'completed'
                                  ? 'neutral'
                                  : 'neutral'
                              }
                              size="sm"
                              className="shrink-0 text-[10px]"
                            >
                              {m.status === 'live'
                                ? 'LIVE'
                                : m.status === 'completed'
                                ? 'SELESAI'
                                : 'TERJADWAL'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
