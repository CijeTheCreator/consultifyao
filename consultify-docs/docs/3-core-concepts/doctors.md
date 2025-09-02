---
sidebar_position: 4
---

# Doctor

## Anatomy of a Doctor

A doctor represents a medical professional registered on the platform who can be assigned to consultations based on specialty and stake-weighted selection.

### Doctor Structure

```lua
Doctors[doctor_id] = {
  doctor_id = "doctor_process_id",
  specialty_type = "Cardiology",
  language_preference = "en", 
  registration_date = 1725291600,
  stake = 50 -- USDA tokens staked for consultation priority
}
```

### Field Descriptions

- **doctor_id**: Unique process ID identifying the doctor
- **specialty_type**: Medical specialty for consultation matching
- **language_preference**: Doctor's preferred language for consultations  
- **registration_date**: Unix timestamp when doctor registered
- **stake**: Amount of USDA tokens staked for weighted assignment

### Medical Specialties

The platform supports these medical specialties:

- **General Medicine**: Primary care and general health issues
- **Cardiology**: Heart and cardiovascular system
- **Dermatology**: Skin, hair, and nail conditions
- **Endocrinology**: Hormones and endocrine system
- **Gastroenterology**: Digestive system disorders
- **Neurology**: Brain, spinal cord, and nervous system
- **Oncology**: Cancer diagnosis and treatment
- **Orthopedics**: Bones, joints, and musculoskeletal system
- **Pediatrics**: Medical care for infants, children, and adolescents
- **Psychiatry**: Mental health and psychological disorders  
- **Pulmonology**: Respiratory system and lung diseases
- **Radiology**: Medical imaging and diagnostics
- **Surgery**: Surgical procedures and interventions
- **Urology**: Urinary tract and male reproductive system

### Stake-Based Assignment

Doctors are assigned to consultations using weighted random selection based on their stake:

#### Minimum Requirements
- **Minimum Stake**: 5 USDA tokens required for consultation eligibility
- **Specialty Matching**: Doctors with matching specialty are prioritized
- **Fallback Selection**: If no specialty match, any qualified doctor can be selected

#### Weight Calculation
Higher stake = higher probability of assignment:
```
Probability = Doctor's Stake / Total Stake of All Qualified Doctors
```

### Doctor Lifecycle

1. **Registration**: Doctor creates account with specialty and language
2. **Staking**: Doctor deposits USDA tokens to become eligible
3. **Assignment**: System selects doctor for matching consultations  
4. **Consultation**: Doctor communicates with patient through translation
5. **Unstaking**: Doctor can withdraw stake and become inactive
