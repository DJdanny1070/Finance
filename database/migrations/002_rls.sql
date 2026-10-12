-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_health_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES policies
-- ============================================================
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- INCOME SOURCES policies
-- ============================================================
CREATE POLICY "income_sources_select" ON income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "income_sources_insert" ON income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_sources_update" ON income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "income_sources_delete" ON income_sources FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- INCOME TRANSACTIONS policies
-- ============================================================
CREATE POLICY "income_transactions_select" ON income_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "income_transactions_insert" ON income_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_transactions_update" ON income_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "income_transactions_delete" ON income_transactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- EXPENSE TRANSACTIONS policies
-- ============================================================
CREATE POLICY "expense_transactions_select" ON expense_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expense_transactions_insert" ON expense_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expense_transactions_update" ON expense_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expense_transactions_delete" ON expense_transactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- ASSETS policies
-- ============================================================
CREATE POLICY "assets_select" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assets_insert" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assets_update" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "assets_delete" ON assets FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- LIABILITIES policies
-- ============================================================
CREATE POLICY "liabilities_select" ON liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "liabilities_insert" ON liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "liabilities_update" ON liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "liabilities_delete" ON liabilities FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- BUDGETS policies
-- ============================================================
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FINANCIAL GOALS policies
-- ============================================================
CREATE POLICY "goals_select" ON financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert" ON financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update" ON financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete" ON financial_goals FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- NET WORTH SNAPSHOTS policies
-- ============================================================
CREATE POLICY "snapshots_select" ON net_worth_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "snapshots_insert" ON net_worth_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "snapshots_update" ON net_worth_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "snapshots_delete" ON net_worth_snapshots FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FINANCIAL HEALTH SCORES policies
-- ============================================================
CREATE POLICY "health_scores_select" ON financial_health_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "health_scores_insert" ON financial_health_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health_scores_update" ON financial_health_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "health_scores_delete" ON financial_health_scores FOR DELETE USING (auth.uid() = user_id);
