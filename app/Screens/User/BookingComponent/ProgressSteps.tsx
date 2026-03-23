// components/ProgressSteps.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ProgressStepsProps = {
  completed: number; // 0 to 3
  total?: number;    // default 3
};

export const ProgressSteps = ({ completed, total = 4 }: ProgressStepsProps) => {
  const steps = [
    { label: 'Services', number: 1 },
    { label: 'Date', number: 2 },
    { label: 'Time', number: 3 },
    { label: 'Confirm', number: 4 },
  ];

  return (
    <View style={styles.container}>
      {/* Simple step indicators */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isCompleted = step.number <= completed;
          const isActive = step.number === completed + 1;
          const isUpcoming = step.number > completed + 1;

          return (
            <React.Fragment key={step.number}>
              {/* Step indicator */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    isCompleted && styles.stepDotCompleted,
                    isActive && styles.stepDotActive,
                    isUpcoming && styles.stepDotUpcoming,
                  ]}
                >
                  {isCompleted ? (
                    <Text style={styles.stepDotText}>✓</Text>
                  ) : (
                    <Text style={[
                      styles.stepDotText,
                      isActive && styles.stepDotTextActive,
                    ]}>
                      {step.number}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  isCompleted && styles.stepLabelCompleted,
                  isActive && styles.stepLabelActive,
                ]}>
                  {step.label}
                </Text>
              </View>

              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <View style={[
                  styles.connector,
                  step.number < completed && styles.connectorCompleted
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress text indicator */}
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Step {completed + 1} of {total}: {steps[completed]?.label || 'Complete'}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((completed + 1) / total) * 100}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  stepItem: {
    flex: 1,
    alignItems: 'center',
  },

  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  stepDotCompleted: {
    backgroundColor: '#34C759', // Green for completed
  },

  stepDotActive: {
    backgroundColor: '#007AFF', // Blue for active
  },

  stepDotUpcoming: {
    backgroundColor: '#E5E5EA', // Light gray for upcoming
  },

  stepDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  stepDotTextActive: {
    color: '#FFFFFF',
  },

  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },

  stepLabelCompleted: {
    color: '#34C759',
  },

  stepLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  connector: {
    height: 2,
    flex: 0.8,
    backgroundColor: '#E5E5EA',
    marginBottom: 24, // Align with dots
  },

  connectorCompleted: {
    backgroundColor: '#34C759',
  },

  progressInfo: {
    marginTop: 4,
  },

  progressText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
  },

  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});