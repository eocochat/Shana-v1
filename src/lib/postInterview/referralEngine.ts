import { ReferralState } from './reviewState';

class ReferralEngine {
  public sendInvite(sessionId: string, state: ReferralState, email: string): ReferralState {
    const updated = { ...state };
    updated.invitesSent += 1;
    
    // Simulate a referral conversion for testing and demonstration after a delay, or instantly
    const hasReward = updated.invitesSent % 2 === 0;
    if (hasReward) {
      updated.conversionsCount += 1;
      const newReward = `Premium Trial Bonus Unlocked (Invite #${updated.invitesSent})`;
      if (!updated.rewardsUnlocked.includes(newReward)) {
        updated.rewardsUnlocked.push(newReward);
      }
    }

    // Save in state cache
    const cached = localStorage.getItem(`shana_post_interview_${sessionId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.referrals = updated;
        localStorage.setItem(`shana_post_interview_${sessionId}`, JSON.stringify(parsed));
      } catch (e) {}
    }

    return updated;
  }

  public getReferralRewards(state: ReferralState, isFR: boolean) {
    return [
      {
        id: 'rew_credits',
        title: isFR ? "+5 Crédits d'Entretien" : "+5 Interview Credits",
        requirement: isFR ? "Partagez avec 1 ami" : "Invite 1 friend to SHANA",
        status: state.invitesSent >= 1 ? 'unlocked' : 'locked',
        reward: isFR ? "5 crédits d'analyse vocale gratuits" : "5 free high-fidelity voice assessment credits"
      },
      {
        id: 'rew_trial',
        title: isFR ? "Essai Premium de 3 jours" : "3-Day Premium Trial",
        requirement: isFR ? "1 inscription réussie d'un ami" : "1 friend successfully joins SHANA",
        status: state.conversionsCount >= 1 ? 'unlocked' : 'locked',
        reward: isFR ? "Accès illimité à tous les modules" : "Unlimited access to all coaching and simulator modules"
      },
      {
        id: 'rew_unlimited',
        title: isFR ? "Garantie Premium à Vie" : "Elite Status Unlocked",
        requirement: isFR ? "5 inscriptions réussies d'amis" : "5 friends successfully join SHANA",
        status: state.conversionsCount >= 5 ? 'unlocked' : 'locked',
        reward: isFR ? "Doublement permanent de vos crédits" : "Permanent double credits on your monthly quota"
      }
    ];
  }
}

export const referralEngine = new ReferralEngine();
