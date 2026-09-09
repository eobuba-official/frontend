import confidentHodu from '@/assets/img/hodu-avatar-confident.png'
import laughHodu from '@/assets/img/hodu-avatar-laugh.png'
import loveHodu from '@/assets/img/hodu-avatar-love.png'
import neutralHodu from '@/assets/img/hodu-avatar-neutral.png'
import relaxedHodu from '@/assets/img/hodu-avatar-relaxed.png'
import surprisedHodu from '@/assets/img/hodu-avatar-surprised.png'
import winkHodu from '@/assets/img/hodu-avatar-wink.png'

const hoduAvatars = [
  neutralHodu,
  laughHodu,
  winkHodu,
  surprisedHodu,
  relaxedHodu,
  loveHodu,
  confidentHodu,
]

function shuffledHoduAvatars() {
  const avatars = [...hoduAvatars]
  for (let index = avatars.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    const currentAvatar = avatars[index]
    const targetAvatar = avatars[target]
    if (!currentAvatar || !targetAvatar) continue
    avatars[index] = targetAvatar
    avatars[target] = currentAvatar
  }
  return avatars
}

let avatarPool = shuffledHoduAvatars()
let avatarIndex = 0
let previousAvatar = ''

export function nextHoduAvatar() {
  if (avatarIndex >= avatarPool.length) {
    avatarPool = shuffledHoduAvatars()
    avatarIndex = 0

    if (avatarPool.length > 1 && avatarPool[0] === previousAvatar) {
      const firstAvatar = avatarPool[0]
      const secondAvatar = avatarPool[1]
      if (firstAvatar && secondAvatar) {
        avatarPool[0] = secondAvatar
        avatarPool[1] = firstAvatar
      }
    }
  }

  const avatar = avatarPool[avatarIndex] ?? neutralHodu
  avatarIndex += 1
  previousAvatar = avatar
  return avatar
}
