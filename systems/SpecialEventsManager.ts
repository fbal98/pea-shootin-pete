import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackSpecialEvent, trackEventParticipation } from '../utils/analytics';
import { useEconomyStore } from '../store/economyStore';

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'seasonal' | 'flash' | 'limited_time';
  status: 'upcoming' | 'active' | 'expired';
  startTime: number;
  endTime: number;

  // Visual design
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundImage?: string;
    icon: string;
  };

  // Event mechanics
  objectives: EventObjective[];
  rewards: EventReward[];
  leaderboard?: EventLeaderboard;

  // FOMO elements
  exclusiveItems?: string[]; // Store item IDs available only during event
  limitedQuantity?: Record<string, number>; // Item ID -> quantity available
  participantCount?: number;
  maxParticipants?: number;

  // Requirements
  requirements?: {
    minLevel?: number;
    prerequisiteEvent?: string;
    premium?: boolean;
  };

  // Metadata
  createdAt: number;
  priority: number; // Higher priority events show first
  tags: string[];
}

export interface EventObjective {
  id: string;
  description: string;
  type: 'score' | 'play_games' | 'complete_levels' | 'collect_items' | 'social_action';
  target: number;
  current: number;
  reward: EventReward;
  completed: boolean;
}

export interface EventReward {
  id: string;
  type: 'currency' | 'item' | 'exclusive_skin' | 'booster' | 'title' | 'badge';
  amount?: number;
  currency?: 'coins' | 'gems' | 'energy' | 'tokens';
  itemId?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  description: string;
  imageUrl?: string;
}

export interface EventLeaderboard {
  id: string;
  metric: 'score' | 'levels_completed' | 'objectives_completed';
  entries: EventLeaderboardEntry[];
  playerRank?: number;
  topRewards: EventReward[];
  rankRewards: Record<string, EventReward>; // Rank range -> reward
}

export interface EventLeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  avatar?: string;
}

export interface EventParticipation {
  eventId: string;
  playerId: string;
  joinedAt: number;
  progress: Record<string, number>; // objective ID -> progress
  completedObjectives: string[];
  rewardsClaimed: string[];
  leaderboardScore?: number;
}

export interface FlashSale {
  id: string;
  itemId: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  startTime: number;
  endTime: number;
  maxPurchases?: number;
  purchaseCount: number;
  urgent: boolean; // For countdown timers
}

class SpecialEventsManager {
  private static instance: SpecialEventsManager;
  private events: Map<string, SpecialEvent> = new Map();
  private participations: Map<string, EventParticipation> = new Map();
  private flashSales: Map<string, FlashSale> = new Map();
  private eventUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadEvents();
    this.startEventUpdates();
  }

  public static getInstance(): SpecialEventsManager {
    if (!SpecialEventsManager.instance) {
      SpecialEventsManager.instance = new SpecialEventsManager();
    }
    return SpecialEventsManager.instance;
  }

  private async loadEvents() {
    try {
      // Load saved events and participations
      const eventsData = await AsyncStorage.getItem('special-events');
      const participationsData = await AsyncStorage.getItem('event-participations');
      const flashSalesData = await AsyncStorage.getItem('flash-sales');

      if (eventsData) {
        const events = JSON.parse(eventsData);
        this.events = new Map(events);
      }

      if (participationsData) {
        const participations = JSON.parse(participationsData);
        this.participations = new Map(participations);
      }

      if (flashSalesData) {
        const flashSales = JSON.parse(flashSalesData);
        this.flashSales = new Map(flashSales);
      }

      // Initialize with default events if none exist
      if (this.events.size === 0) {
        this.initializeDefaultEvents();
      }
    } catch (error) {
      console.error('Error loading events:', error);
      this.initializeDefaultEvents();
    }
  }

  private async saveEvents() {
    try {
      await AsyncStorage.setItem(
        'special-events',
        JSON.stringify(Array.from(this.events.entries()))
      );
      await AsyncStorage.setItem(
        'event-participations',
        JSON.stringify(Array.from(this.participations.entries()))
      );
      await AsyncStorage.setItem(
        'flash-sales',
        JSON.stringify(Array.from(this.flashSales.entries()))
      );
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }

  private initializeDefaultEvents() {
    const now = Date.now();

    // Daily Login Event
    this.createEvent({
      id: 'daily_login',
      name: 'Daily Login Bonus',
      description: 'Login daily to earn increasing rewards!',
      type: 'daily',
      startTime: now,
      endTime: now + 24 * 60 * 60 * 1000, // 24 hours
      theme: {
        primaryColor: '#4ECDC4',
        secondaryColor: '#F7FFF7',
        icon: '🎁',
      },
      objectives: [
        {
          id: 'login_day_1',
          description: 'Login today',
          type: 'social_action',
          target: 1,
          current: 0,
          completed: false,
          reward: {
            id: 'login_coins',
            type: 'currency',
            currency: 'coins',
            amount: 100,
            description: '100 Coins',
          },
        },
      ],
      rewards: [],
      priority: 10,
      tags: ['daily', 'login', 'currency'],
      createdAt: now,
      status: 'active',
    });

    // Weekend Score Challenge
    this.createEvent({
      id: 'weekend_challenge',
      name: 'Weekend Score Blitz',
      description: 'Compete for the highest score this weekend!',
      type: 'weekly',
      startTime: this.getNextWeekend(),
      endTime: this.getNextWeekend() + 2 * 24 * 60 * 60 * 1000, // 2 days
      theme: {
        primaryColor: '#FF6B6B',
        secondaryColor: '#FFE0E0',
        icon: '🏆',
      },
      objectives: [
        {
          id: 'score_10k',
          description: 'Score 10,000 points in a single game',
          type: 'score',
          target: 10000,
          current: 0,
          completed: false,
          reward: {
            id: 'score_gems',
            type: 'currency',
            currency: 'gems',
            amount: 25,
            description: '25 Gems',
          },
        },
      ],
      rewards: [
        {
          id: 'weekend_exclusive',
          type: 'exclusive_skin',
          itemId: 'pete_weekend_warrior',
          description: 'Exclusive Weekend Warrior Pete Skin',
          rarity: 'exclusive',
        },
      ],
      leaderboard: {
        id: 'weekend_leaderboard',
        metric: 'score',
        entries: [],
        topRewards: [
          {
            id: 'first_place',
            type: 'currency',
            currency: 'gems',
            amount: 500,
            description: '500 Gems (1st Place)',
          },
        ],
        rankRewards: {
          '1-3': {
            id: 'top_3',
            type: 'item',
            itemId: 'golden_booster_pack',
            description: 'Golden Booster Pack',
          },
          '4-10': {
            id: 'top_10',
            type: 'currency',
            currency: 'gems',
            amount: 100,
            description: '100 Gems',
          },
        },
      },
      priority: 8,
      tags: ['weekend', 'competition', 'leaderboard'],
      createdAt: now,
      status: 'upcoming',
    });

    // Flash Sale Event
    this.createFlashSale({
      id: 'gems_flash_sale',
      itemId: 'gems_mega_pack',
      originalPrice: 200,
      salePrice: 100,
      discount: 50,
      startTime: now + 60 * 60 * 1000, // 1 hour from now
      endTime: now + 4 * 60 * 60 * 1000, // 4 hours from now
      maxPurchases: 1000,
      purchaseCount: 0,
      urgent: true,
    });

    // Limited Time Seasonal Event
    this.createEvent({
      id: 'winter_wonderland',
      name: 'Winter Wonderland',
      description: 'A magical winter event with exclusive snow-themed content!',
      type: 'seasonal',
      startTime: now + 7 * 24 * 60 * 60 * 1000, // 1 week from now
      endTime: now + 21 * 24 * 60 * 60 * 1000, // 3 weeks from now
      theme: {
        primaryColor: '#87CEEB',
        secondaryColor: '#F0F8FF',
        icon: '❄️',
      },
      objectives: [
        {
          id: 'winter_levels',
          description: 'Complete 50 levels during the event',
          type: 'complete_levels',
          target: 50,
          current: 0,
          completed: false,
          reward: {
            id: 'winter_currency',
            type: 'currency',
            currency: 'tokens',
            amount: 100,
            description: '100 Winter Tokens',
          },
        },
      ],
      rewards: [
        {
          id: 'snow_pete',
          type: 'exclusive_skin',
          itemId: 'pete_snow',
          description: 'Exclusive Snow Pete Skin',
          rarity: 'legendary',
        },
      ],
      exclusiveItems: ['pete_snow', 'winter_booster', 'snowball_projectile'],
      maxParticipants: 50000,
      priority: 9,
      tags: ['seasonal', 'winter', 'limited'],
      createdAt: now,
      status: 'upcoming',
    });
  }

  private createEvent(eventData: Omit<SpecialEvent, 'participantCount'>) {
    const event: SpecialEvent = {
      ...eventData,
      participantCount: 0,
    };
    this.events.set(event.id, event);
    this.saveEvents();
  }

  private createFlashSale(saleData: FlashSale) {
    this.flashSales.set(saleData.id, saleData);
    this.saveEvents();
  }

  private getNextWeekend(): number {
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay()) % 7;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(0, 0, 0, 0);
    return nextSaturday.getTime();
  }

  private startEventUpdates() {
    // Update events every minute
    this.eventUpdateInterval = setInterval(() => {
      this.updateEventStatuses();
      this.updateFlashSales();
    }, 60 * 1000);
  }

  private updateEventStatuses() {
    const now = Date.now();
    let updated = false;

    this.events.forEach((event, eventId) => {
      let newStatus = event.status;

      if (now < event.startTime) {
        newStatus = 'upcoming';
      } else if (now >= event.startTime && now < event.endTime) {
        newStatus = 'active';
      } else if (now >= event.endTime) {
        newStatus = 'expired';
      }

      if (newStatus !== event.status) {
        event.status = newStatus;
        updated = true;

        // Track event status changes
        trackSpecialEvent({
          eventId,
          eventName: event.name,
          eventType: event.type,
          action: newStatus,
          timestamp: now,
        });
      }
    });

    if (updated) {
      this.saveEvents();
    }
  }

  private updateFlashSales() {
    const now = Date.now();
    let updated = false;

    this.flashSales.forEach((sale, saleId) => {
      if (now >= sale.endTime) {
        this.flashSales.delete(saleId);
        updated = true;
      }
    });

    if (updated) {
      this.saveEvents();
    }
  }

  // Public API
  public getActiveEvents(): SpecialEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.status === 'active')
      .sort((a, b) => b.priority - a.priority);
  }

  public getUpcomingEvents(): SpecialEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.status === 'upcoming')
      .sort((a, b) => a.startTime - b.startTime);
  }

  public getEvent(eventId: string): SpecialEvent | undefined {
    return this.events.get(eventId);
  }

  public joinEvent(eventId: string, playerId: string): boolean {
    const event = this.events.get(eventId);
    if (!event || event.status !== 'active') {
      return false;
    }

    // Check requirements
    if (event.requirements) {
      // In a real implementation, check player level, prerequisites, etc.
    }

    // Check participant limit
    if (event.maxParticipants && event.participantCount! >= event.maxParticipants) {
      return false;
    }

    // Create participation record
    const participation: EventParticipation = {
      eventId,
      playerId,
      joinedAt: Date.now(),
      progress: {},
      completedObjectives: [],
      rewardsClaimed: [],
    };

    this.participations.set(`${eventId}_${playerId}`, participation);
    event.participantCount = (event.participantCount || 0) + 1;

    // Track participation
    trackEventParticipation({
      eventId,
      eventName: event.name,
      playerId,
      action: 'joined',
      timestamp: Date.now(),
    });

    this.saveEvents();
    return true;
  }

  public updateProgress(eventId: string, playerId: string, objectiveId: string, progress: number) {
    const participationKey = `${eventId}_${playerId}`;
    const participation = this.participations.get(participationKey);
    const event = this.events.get(eventId);

    if (!participation || !event) {
      return;
    }

    const objective = event.objectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.completed) {
      return;
    }

    // Update progress
    participation.progress[objectiveId] = Math.max(
      participation.progress[objectiveId] || 0,
      progress
    );

    // Check if objective is completed
    if (participation.progress[objectiveId] >= objective.target) {
      objective.completed = true;
      participation.completedObjectives.push(objectiveId);

      // Award reward
      this.awardReward(playerId, objective.reward);

      // Track objective completion
      trackEventParticipation({
        eventId,
        eventName: event.name,
        playerId,
        action: 'objective_completed',
        objectiveId,
        timestamp: Date.now(),
      });
    }

    this.saveEvents();
  }

  private awardReward(playerId: string, reward: EventReward) {
    const economyStore = useEconomyStore.getState();

    switch (reward.type) {
      case 'currency':
        if (reward.currency && reward.amount) {
          economyStore.addCurrency(
            reward.currency,
            reward.amount,
            `Event reward: ${reward.description}`
          );
        }
        break;
      case 'item':
      case 'exclusive_skin':
        if (reward.itemId) {
          // Add item to player's inventory
          // This would integrate with the economy store
        }
        break;
      // Handle other reward types
    }
  }

  public getActiveFlashSales(): FlashSale[] {
    const now = Date.now();
    return Array.from(this.flashSales.values())
      .filter(sale => now >= sale.startTime && now < sale.endTime)
      .sort((a, b) => a.endTime - b.endTime); // Sort by urgency
  }

  public getTimeRemaining(endTime: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } {
    const now = Date.now();
    const total = Math.max(0, endTime - now);

    const days = Math.floor(total / (24 * 60 * 60 * 1000));
    const hours = Math.floor((total % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((total % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((total % (60 * 1000)) / 1000);

    return { days, hours, minutes, seconds, total };
  }

  public getEventProgress(eventId: string, playerId: string): EventParticipation | undefined {
    return this.participations.get(`${eventId}_${playerId}`);
  }

  public claimEventReward(eventId: string, playerId: string, rewardId: string): boolean {
    const participationKey = `${eventId}_${playerId}`;
    const participation = this.participations.get(participationKey);
    const event = this.events.get(eventId);

    if (!participation || !event) {
      return false;
    }

    // Check if reward is already claimed
    if (participation.rewardsClaimed.includes(rewardId)) {
      return false;
    }

    // Find and award the reward
    const reward = event.rewards.find(r => r.id === rewardId);
    if (reward) {
      this.awardReward(playerId, reward);
      participation.rewardsClaimed.push(rewardId);
      this.saveEvents();
      return true;
    }

    return false;
  }

  public cleanup() {
    if (this.eventUpdateInterval) {
      clearInterval(this.eventUpdateInterval);
      this.eventUpdateInterval = null;
    }
  }
}

export const specialEventsManager = SpecialEventsManager.getInstance();
