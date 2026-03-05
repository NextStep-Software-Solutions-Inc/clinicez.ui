export function calculateBMI(weight: number | null, height: number | null): string | null {
    if (!weight || !height) return null
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
}

export function calculateBodyFat(weight: number | null, height: number | null, gender: string | null): string | null {
    if (!weight || !height) return null
    const bmi = parseFloat(calculateBMI(weight, height) ?? '0')
    if (bmi === 0) return null
    return gender?.toUpperCase() === 'MALE'
        ? ((bmi * 1.07) - 7).toFixed(1)
        : ((bmi * 1.07) - 2).toFixed(1)
}

export function getBMICategory(bmi: number | null): string {
    if (bmi === null) return 'N/A'
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 25) return 'Normal'
    if (bmi < 30) return 'Overweight'
    return 'Obese'
}

export function getBMICategoryWithColor(bmi: number | null): { category: string; color: string } {
    if (bmi === null) return { category: 'N/A', color: 'text-slate-500' }
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600 dark:text-blue-400' }
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600 dark:text-green-400' }
    if (bmi < 30) return { category: 'Overweight', color: 'text-amber-600 dark:text-amber-400' }
    return { category: 'Obese', color: 'text-red-600 dark:text-red-400' }
}

export function getBodyFatCategory(bodyFat: number | null, gender: string | null): string {
    if (bodyFat === null) return 'N/A'
    const bf = parseFloat(bodyFat.toString())
    const isMale = gender?.toUpperCase() === 'MALE'
    if (isMale) {
        if (bf < 10) return 'Essential'
        if (bf < 14) return 'Athlete'
        if (bf < 18) return 'Fitness'
        if (bf < 25) return 'Average'
        return 'High'
    } else {
        if (bf < 13) return 'Essential'
        if (bf < 20) return 'Athlete'
        if (bf < 25) return 'Fitness'
        if (bf < 32) return 'Average'
        return 'High'
    }
}

export function getBodyFatCategoryWithColor(bodyFat: number | null, gender: string | null): { category: string; color: string } {
    if (bodyFat === null) return { category: 'N/A', color: 'text-slate-500' }
    const bf = parseFloat(bodyFat.toString())
    const isMale = gender?.toUpperCase() === 'MALE'
    if (isMale) {
        if (bf < 10) return { category: 'Very Low', color: 'text-blue-600 dark:text-blue-400' }
        if (bf < 20) return { category: 'Healthy', color: 'text-green-600 dark:text-green-400' }
        if (bf < 25) return { category: 'Moderate', color: 'text-amber-600 dark:text-amber-400' }
        return { category: 'High', color: 'text-red-600 dark:text-red-400' }
    } else {
        if (bf < 18) return { category: 'Very Low', color: 'text-blue-600 dark:text-blue-400' }
        if (bf < 25) return { category: 'Healthy', color: 'text-green-600 dark:text-green-400' }
        if (bf < 32) return { category: 'Moderate', color: 'text-amber-600 dark:text-amber-400' }
        return { category: 'High', color: 'text-red-600 dark:text-red-400' }
    }
}

export function getVitalStatusColor(value: number | null, min: number, optimal: number, max: number): string {
    if (value === null) return 'text-slate-500'
    if (value < min || value > max) return 'text-red-600 dark:text-red-400'
    if (value < optimal || value > optimal + 10) return 'text-amber-600 dark:text-amber-400'
    return 'text-green-600 dark:text-green-400'
}

interface VitalRemark {
    icon: string
    text: string
}

interface VitalsSnapshot {
    bpSystolic?: number | null
    bpDiastolic?: number | null
    pulseRate?: number | null
    temp?: number | null
    spo2?: number | null
    respRate?: number | null
    weight?: number | null
    height?: number | null
    bmi?: number | null
}

export function generateClinicalRemarks(vitals: VitalsSnapshot, gender: string | null): VitalRemark[] {
    const remarks: VitalRemark[] = []

    if (vitals.bpSystolic && vitals.bpDiastolic) {
        const sys = vitals.bpSystolic
        const dia = vitals.bpDiastolic
        if (sys >= 180 || dia >= 120) {
            remarks.push({ icon: '⚠️', text: 'Blood pressure is critically high - immediate medical attention recommended' })
        } else if (sys >= 140 || dia >= 90) {
            remarks.push({ icon: '⚠️', text: 'Blood pressure is elevated - monitor closely' })
        } else if (sys < 90 || dia < 60) {
            remarks.push({ icon: '⚠️', text: 'Blood pressure is low - may cause dizziness' })
        }
    }

    if (vitals.pulseRate) {
        if (vitals.pulseRate > 100) {
            remarks.push({ icon: '❤️', text: 'Heart rate is elevated - may need attention' })
        } else if (vitals.pulseRate < 60) {
            remarks.push({ icon: '💓', text: 'Heart rate is lower than normal - may indicate athletic fitness' })
        }
    }

    if (vitals.temp) {
        if (vitals.temp > 38) {
            remarks.push({ icon: '🌡️', text: 'Temperature is elevated - possible fever, seek medical advice' })
        } else if (vitals.temp < 36) {
            remarks.push({ icon: '🌡️', text: 'Temperature is below normal - monitor for hypothermia' })
        }
    }

    if (vitals.spo2 && vitals.spo2 < 95) {
        remarks.push({ icon: '💨', text: 'Oxygen saturation is low - may need supplemental oxygen' })
    }

    if (vitals.respRate) {
        if (vitals.respRate > 25) {
            remarks.push({ icon: '🫁', text: 'Respiratory rate is elevated - may indicate respiratory distress' })
        } else if (vitals.respRate < 12) {
            remarks.push({ icon: '🫁', text: 'Respiratory rate is low - monitor breathing pattern' })
        }
    }

    const displayBMI = vitals.bmi ?? calculateBMI(vitals.weight ?? null, vitals.height ?? null)
    if (displayBMI) {
        const bmiNum = parseFloat(String(displayBMI))
        if (bmiNum < 18.5) {
            remarks.push({ icon: '⚖️', text: 'BMI indicates underweight - consider nutritional consultation' })
        } else if (bmiNum >= 30) {
            remarks.push({ icon: '⚖️', text: 'BMI indicates obesity - lifestyle changes recommended' })
        } else if (bmiNum >= 25) {
            remarks.push({ icon: '⚖️', text: 'BMI indicates overweight - consider weight management' })
        }
    }

    const bodyFat = calculateBodyFat(vitals.weight ?? null, vitals.height ?? null, gender)
    if (bodyFat) {
        const bfNum = parseFloat(bodyFat)
        const isMale = gender?.toUpperCase() === 'MALE'
        if (isMale && bfNum > 25) {
            remarks.push({ icon: '💪', text: 'Body fat is higher than healthy range for males - fitness program recommended' })
        } else if (!isMale && bfNum > 32) {
            remarks.push({ icon: '💪', text: 'Body fat is higher than healthy range for females - fitness program recommended' })
        }
    }

    return remarks
}

export function generateVitalRemarks(vitals: VitalsSnapshot, gender: string | null): string[] {
    const remarks: string[] = []
    const isMale = gender?.toUpperCase() === 'MALE'

    if (vitals.bpSystolic && vitals.bpSystolic > 140) {
        remarks.push('⚠️ Blood pressure is elevated - consider monitoring')
    } else if (vitals.bpSystolic && vitals.bpSystolic > 130) {
        remarks.push('📊 Blood pressure is slightly elevated')
    }

    if (vitals.pulseRate) {
        if (vitals.pulseRate < 60 || vitals.pulseRate > 100) {
            remarks.push(`⚠️ Heart rate is ${vitals.pulseRate < 60 ? 'low' : 'high'} - may need attention`)
        }
    }

    if (vitals.temp) {
        if (vitals.temp > 38) {
            remarks.push('🌡️ Temperature is elevated - possible fever')
        } else if (vitals.temp < 36.5) {
            remarks.push('❄️ Temperature is low')
        }
    }

    if (vitals.spo2 && vitals.spo2 < 95) {
        remarks.push('⚠️ Oxygen saturation is low - consult healthcare provider')
    }

    const bmi = calculateBMI(vitals.weight ?? null, vitals.height ?? null)
    if (bmi) {
        const bmiNum = parseFloat(bmi)
        if (bmiNum >= 30) {
            remarks.push('📈 BMI indicates obesity - lifestyle changes recommended')
        } else if (bmiNum >= 25) {
            remarks.push('📊 BMI indicates overweight - consider exercise and diet')
        }
    }

    const bodyFat = calculateBodyFat(vitals.weight ?? null, vitals.height ?? null, gender)
    if (bodyFat) {
        const bf = parseFloat(bodyFat)
        if (isMale) {
            if (bf >= 25) remarks.push('💪 Body fat is higher than healthy range for males')
            else if (bf < 10) remarks.push('💪 Body fat is in athlete/very fit range')
        } else {
            if (bf >= 32) remarks.push('💪 Body fat is higher than healthy range for females')
            else if (bf < 18) remarks.push('💪 Body fat is in athlete/very fit range')
        }
    }

    return remarks.length > 0 ? remarks : ['✅ Vital signs appear normal']
}
