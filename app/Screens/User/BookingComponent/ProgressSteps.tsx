// components/ProgressSteps.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ProgressStepsProps = {
  completed: number; // 0 to 3
  total?: number;    // default 3
};

export const ProgressSteps = ({ completed, total = 3 }: ProgressStepsProps) => {
  const steps = [
    { label: 'Services', number: 1 },
    { label: 'Date', number: 2 },
    { label: 'Time', number: 3 },
  ];

  const progressPercentage = Math.min((completed / total) * 100, 100);

  return (
    <View style={styles.progressSection}>
      {/* Step circles with connecting line */}
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isCompleted = step.number <= completed;
          const isCurrent = step.number === completed + 1;

          return (
            <React.Fragment key={step.number}>
              <View style={styles.stepWrapper}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCompleted,
                    isCurrent && styles.stepCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      isCompleted && styles.stepNumberCompleted,
                      isCurrent && styles.stepNumberCurrent,
                    ]}
                  >
                    {step.number}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting line - only between steps */}
              {index < steps.length - 1 && (
                <View style={styles.connectorContainer}>
                  <View style={styles.connectorBackground} />
                  <View
                    style={[
                      styles.connectorFill,
                      step.number < completed && styles.connectorFull,
                      step.number === completed && styles.connectorPartial,
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Optional progress bar (can remove if connectors are enough) */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,           // ← reduced vertical padding (was 20)
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,              // ← reduced from 16–20
  },

  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },

  stepCircle: {
    width: 40,                     // ← smaller circle (was 48)
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  stepCompleted: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  stepCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
    borderWidth: 5,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.08 }],
  },

  stepNumber: {
    fontSize: 16,                  // ← slightly smaller number
    fontWeight: '700',
    color: '#64748B',
  },

  stepNumberCompleted: {
    color: '#FFFFFF',
  },

  stepNumberCurrent: {
    color: '#3B82F6',
    fontWeight: '800',
  },

  stepLabel: {
    marginTop: 6,                  // ← tighter spacing
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.2,
  },

  stepLabelCompleted: {
    color: '#2563EB',
    fontWeight: '600',
  },

  stepLabelCurrent: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // Connector line between steps
  connectorContainer: {
    position: 'absolute',
    top: 20,                       // ← aligned to smaller circle center
    left: '50%',
    right: -1,
    height: 3,
    zIndex: -1,
  },

  connectorBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },

  connectorFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    width: 0,
  },

  connectorFull: {
    width: '100%',
  },

  connectorPartial: {
    width: '50%', // half-filled when current step
  },

  // Progress bar (optional – can remove)
  progressBarContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },

  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
});