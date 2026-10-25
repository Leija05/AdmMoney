import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/app.store';
import { useThemeColors, radii, gradients } from '../../theme';
import { DoubleBezelCard } from '../ui/DoubleBezelCard';
import { LinearGradient } from 'expo-linear-gradient';

interface MonthlyGoalCardProps {
  currentProfit: number;
}

export const MonthlyGoalCard: React.FC<MonthlyGoalCardProps> = ({ currentProfit }) => {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const { monthlyGoal, setMonthlyGoal, currency, privacyMode } = useAppStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(String(monthlyGoal || 15000));

  const goal = monthlyGoal > 0 ? monthlyGoal : 15000;
  const rawPct = (currentProfit / goal) * 100;
  const progressPct = Math.min(Math.max(rawPct, 0), 100);
  const isExceeded = currentProfit >= goal;
  const remaining = Math.max(0, goal - currentProfit);

  const handleSaveGoal = () => {
    const val = parseFloat(tempGoal);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa una meta mensual válida mayor a cero.');
      return;
    }
    setMonthlyGoal(val);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <DoubleBezelCard
        gradient={
          isDark
            ? ['rgba(245, 158, 11, 0.12)', 'rgba(217, 119, 6, 0.04)']
            : ['#FFFDF5', '#FEF9C3']
        }
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
            <View style={[styles.targetIconCircle, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.22)' : '#FDE68A' }]}>
              <Ionicons name="trophy" size={15} color={colors.amberLight} />
            </View>
            <View>
              <Text style={[styles.eyebrow, { color: colors.amberLight }]}>
                META DE GANANCIA MENSUAL
              </Text>
              <Text style={[styles.targetText, { color: colors.textMain }]}>
                {privacyMode ? '••••••' : `$${currentProfit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textDim }}>
                  {' '}de ${goal.toLocaleString('es-MX')} {currency}
                </Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setTempGoal(String(monthlyGoal || 15000));
              setIsEditModalOpen(true);
            }}
            style={[styles.editBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', borderColor: colors.borderSubtle }]}
          >
            <Ionicons name="pencil-outline" size={12} color={colors.textMain} />
            <Text style={[styles.editBtnText, { color: colors.textMain }]}>Ajustar</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar Container with Liquid Gold Shimmer */}
        <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
          <LinearGradient
            colors={
              isExceeded
                ? ['#34D399', '#059669']
                : ['#FBBF24', '#D97706']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progressPct}%` }]}
          />
        </View>

        {/* Progress Bottom Subtext */}
        <View style={styles.bottomRow}>
          <Text style={[styles.pctText, { color: isExceeded ? colors.emeraldLight : colors.amberLight }]}>
            {rawPct.toFixed(1)}% completado
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isExceeded && <Ionicons name="trophy" size={12} color={colors.emeraldLight} />}
            <Text style={[styles.remainingText, { color: isExceeded ? colors.emeraldLight : colors.textDim }]}>
              {isExceeded
                ? `¡Meta superada en +$${(currentProfit - goal).toFixed(2)}!`
                : `Faltan $${remaining.toFixed(2)} MXN`}
            </Text>
          </View>
        </View>
      </DoubleBezelCard>

      {/* Edit Goal Mini Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="trophy" size={20} color={colors.amberLight} />
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>Definir Meta Mensual</Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              ¿Cuánto te gustaría ganar en ganancia limpia este mes con Lucky Cookies?
            </Text>

            <View style={styles.inputWrap}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textDim }}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.textMain, backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }]}
                keyboardType="numeric"
                value={tempGoal}
                onChangeText={setTempGoal}
                placeholder="15000"
                placeholderTextColor={colors.textDim}
                autoFocus
              />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim }}>MXN</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveGoal}
                style={[styles.saveBtn, { backgroundColor: colors.amber }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Guardar Meta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  targetText: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctText: {
    fontSize: 11,
    fontWeight: '800',
  },
  remainingText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.outer,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
    lineHeight: 17,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
});
