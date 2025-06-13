import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useEconomyStore,
  useCurrencyBalances,
  useOwnedItems,
  useEquippedItems,
  useStoreItems,
  useFeaturedItems,
  useEconomyActions,
  StoreItem,
} from '../store/economyStore';
import { HyperCasualColors } from '../constants/HyperCasualColors';
import { HyperCasualPete } from '../components/game/HyperCasualPete';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TabConfig {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  filter: (item: StoreItem) => boolean;
}

const TABS: TabConfig[] = [
  {
    id: 'featured',
    title: 'Featured',
    icon: 'star',
    filter: (item) => item.featured,
  },
  {
    id: 'skins',
    title: 'Skins',
    icon: 'shirt',
    filter: (item) => item.category === 'skin',
  },
  {
    id: 'boosters',
    title: 'Boosters',
    icon: 'flash',
    filter: (item) => item.category === 'booster',
  },
  {
    id: 'currency',
    title: 'Currency',
    icon: 'wallet',
    filter: (item) => item.category === 'currency',
  },
  {
    id: 'premium',
    title: 'Premium',
    icon: 'diamond',
    filter: (item) => item.category === 'premium',
  },
];

interface PeteCustomizationScreenProps {
  onBack: () => void;
}

export const PeteCustomizationScreen: React.FC<PeteCustomizationScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('featured');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [previewSkin, setPreviewSkin] = useState<string | null>(null);

  const balances = useCurrencyBalances();
  const ownedItems = useOwnedItems();
  const equippedItems = useEquippedItems();
  const storeItems = useStoreItems();
  const featuredItems = useFeaturedItems();
  const {
    purchaseItem,
    equipItem,
    unequipItem,
    canAfford,
    getItemsByCategory,
    updateEnergy,
  } = useEconomyActions();

  const currentTheme = HyperCasualColors.getTheme(1);

  useEffect(() => {
    // Update energy when screen loads
    updateEnergy();
  }, [updateEnergy]);

  const getItemsForTab = (tabId: string): StoreItem[] => {
    const tab = TABS.find(t => t.id === tabId);
    if (!tab) return [];

    if (tabId === 'featured') {
      return featuredItems.length > 0 ? featuredItems : storeItems.filter(tab.filter);
    }
    
    return storeItems.filter(tab.filter);
  };

  const handleItemPress = (item: StoreItem) => {
    setSelectedItem(item);
    
    // Preview skin items
    if (item.category === 'skin') {
      setPreviewSkin(item.id);
    }
  };

  const handlePurchase = async (item: StoreItem) => {
    if (!canAfford(item.price)) {
      Alert.alert(
        'Insufficient Funds',
        `You need ${item.price.amount} ${item.price.currency} to purchase this item.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const success = await purchaseItem(item.id);
    
    if (success) {
      Alert.alert(
        'Purchase Successful!',
        `You've purchased ${item.name}`,
        [
          {
            text: 'Equip Now',
            onPress: () => {
              if (item.category === 'skin') {
                equipItem('skin', item.id);
                setPreviewSkin(null);
              }
            },
          },
          { text: 'OK' },
        ]
      );
    } else {
      Alert.alert(
        'Purchase Failed',
        'Unable to complete purchase. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEquip = (item: StoreItem) => {
    if (item.category === 'skin') {
      equipItem('skin', item.id);
      setPreviewSkin(null);
      Alert.alert('Equipped!', `${item.name} is now equipped.`);
    }
  };

  const handleUnequip = (item: StoreItem) => {
    if (item.category === 'skin') {
      unequipItem('skin');
      setPreviewSkin(null);
      Alert.alert('Unequipped!', `${item.name} has been unequipped.`);
    }
  };

  const isOwned = (itemId: string) => ownedItems.includes(itemId);
  const isEquipped = (item: StoreItem) => equippedItems[item.category] === item.id;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#808080';
      case 'rare': return '#0066CC';
      case 'epic': return '#9933CC';
      case 'legendary': return '#FF6600';
      default: return '#808080';
    }
  };

  const renderStoreItem = ({ item }: { item: StoreItem }) => {
    const owned = isOwned(item.id);
    const equipped = isEquipped(item);
    const affordable = canAfford(item.price);

    return (
      <TouchableOpacity
        style={[
          styles.storeItem,
          { borderColor: getRarityColor(item.rarity) },
          selectedItem?.id === item.id && { borderColor: currentTheme.primary, borderWidth: 3 },
        ]}
        onPress={() => handleItemPress(item)}
      >
        {item.limited && (
          <View style={[styles.limitedBadge, { backgroundColor: '#FF4444' }]}>
            <Text style={styles.limitedText}>LIMITED</Text>
          </View>
        )}
        
        {item.salePercentage && (
          <View style={[styles.saleBadge, { backgroundColor: '#00AA00' }]}>
            <Text style={styles.saleText}>-{item.salePercentage}%</Text>
          </View>
        )}

        <View style={styles.itemPreview}>
          {item.category === 'skin' ? (
            <HyperCasualPete
              position={{ x: 0, y: 0 }}
              skinId={previewSkin === item.id ? item.id : (equipped ? item.id : undefined)}
              size={40}
            />
          ) : (
            <Text style={styles.itemIcon}>{getCategoryIcon(item.category)}</Text>
          )}
        </View>

        <Text style={[styles.itemName, { color: currentTheme.text }]} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={[styles.itemDescription, { color: currentTheme.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.itemFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.currencyIcon}>{getCurrencyIcon(item.price.currency)}</Text>
            <Text style={[
              styles.priceText,
              { color: affordable ? currentTheme.text : '#FF4444' }
            ]}>
              {item.price.amount}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            {owned ? (
              equipped ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FF6666' }]}
                  onPress={() => handleUnequip(item)}
                >
                  <Text style={styles.actionButtonText}>Unequip</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
                  onPress={() => handleEquip(item)}
                >
                  <Text style={styles.actionButtonText}>Equip</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: affordable ? '#00AA00' : '#888888' }
                ]}
                onPress={() => handlePurchase(item)}
                disabled={!affordable}
              >
                <Text style={styles.actionButtonText}>Buy</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'skin': return '👕';
      case 'booster': return '⚡';
      case 'currency': return '💰';
      case 'premium': return '💎';
      default: return '📦';
    }
  };

  const getCurrencyIcon = (currency: string): string => {
    switch (currency) {
      case 'coins': return '🪙';
      case 'gems': return '💎';
      case 'energy': return '⚡';
      case 'tokens': return '🎫';
      default: return '💰';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          Pete's Store
        </Text>

        <View style={styles.currencyDisplay}>
          <View style={styles.currencyItem}>
            <Text style={styles.currencyIcon}>🪙</Text>
            <Text style={[styles.currencyAmount, { color: currentTheme.text }]}>
              {balances.coins.toLocaleString()}
            </Text>
          </View>
          <View style={styles.currencyItem}>
            <Text style={styles.currencyIcon}>💎</Text>
            <Text style={[styles.currencyAmount, { color: currentTheme.text }]}>
              {balances.gems.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Pete Preview */}
      <View style={styles.previewContainer}>
        <HyperCasualPete
          position={{ x: screenWidth / 2 - 50, y: 50 }}
          skinId={previewSkin || equippedItems.skin}
          size={100}
        />
        <Text style={[styles.previewLabel, { color: currentTheme.textSecondary }]}>
          {previewSkin ? 'Preview' : 'Current Look'}
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: currentTheme.primary },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? 'white' : currentTheme.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.id ? 'white' : currentTheme.textSecondary,
                },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Store Items */}
      <FlatList
        data={getItemsForTab(activeTab)}
        renderItem={renderStoreItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.storeGrid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currencyDisplay: {
    flexDirection: 'row',
    gap: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencyIcon: {
    fontSize: 16,
  },
  currencyAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    padding: 20,
    height: 140,
  },
  previewLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  tabContainer: {
    maxHeight: 60,
  },
  tabContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  storeGrid: {
    padding: 20,
    gap: 16,
  },
  storeItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    borderWidth: 2,
    minHeight: 180,
  },
  limitedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  limitedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  saleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 8,
  },
  itemIcon: {
    fontSize: 32,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  itemDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    flex: 1,
  },
  itemFooter: {
    gap: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});