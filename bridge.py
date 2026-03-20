import sqlite3
import os
import sys
from datetime import datetime

class EMRBridge:
    def __init__(self, db_path="hosp_emr.db"):
        self.db_path = db_path
        self.feature_order = [
            'anchor_age', 'value_change', 'med_change', 'is_icu', 
            'num_services', 'num_transfers', 'is_frequent_test'
        ]
        try:
            import pandas as pd
            self.pd = pd
        except ImportError:
            self.pd = None

    def get_patient_features(self, appointment_id):
        """Standard entry point used by main.py"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            # Get patient and test info from the appointment
            cursor.execute("SELECT patient_id, test_name FROM appointments WHERE id = ?", (appointment_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                vector, _ = self.get_patient_vector(row[0], row[1])
                return vector
            return self.get_patient_vector("P001", "General")[0]
        except:
            return self.get_patient_vector("P001", "General")[0]

    def get_patient_vector(self, patient_id, test_name):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 1. Basic Info
            cursor.execute("SELECT age, history FROM patients WHERE patient_id = ?", (patient_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                return None, "Patient not found"
            
            age = float(row[0])
            history = str(row[1]).upper()

            # 2. Redundancy Check
            cursor.execute(
                "SELECT COUNT(*) FROM verified_tests WHERE patient_id = ? AND test_name = ?", 
                (patient_id, test_name)
            )
            is_frequent_test = 1.0 if cursor.fetchone()[0] > 0 else 0.0

            # 3. Lab Changes
            cursor.execute(
                "SELECT result_value FROM lab_results WHERE patient_id = ? AND test_name = ? ORDER BY timestamp DESC LIMIT 2",
                (patient_id, test_name)
            )
            results = cursor.fetchall()
            value_change = float(results[0][0] - results[1][0]) if len(results) >= 2 else 0.0

            # 4. Clinical Context
            cursor.execute("SELECT COUNT(*) FROM appointments WHERE patient_id = ? AND status = 'completed'", (patient_id,))
            med_change = 1.0 if cursor.fetchone()[0] > 0 else 0.0
            is_icu = 1.0 if "ICU" in history else 0.0
            conn.close()

            data = {
                'anchor_age': [age], 'value_change': [value_change], 'med_change': [med_change],
                'is_icu': [is_icu], 'num_services': [1.0], 'num_transfers': [0.0],
                'is_frequent_test': [is_frequent_test]
            }
            
            if self.pd:
                df = self.pd.DataFrame(data)
                return df[self.feature_order], "Success"
            return data, "Success"
        except Exception as e:
            return None, str(e)