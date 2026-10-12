-- ============================================================
-- Database Functions and Views
-- ============================================================

-- Function: Get monthly income for a user
CREATE OR REPLACE FUNCTION get_monthly_income(p_user_id UUID, p_month INTEGER, p_year INTEGER)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM income_transactions
  WHERE user_id = p_user_id
    AND EXTRACT(MONTH FROM date) = p_month
    AND EXTRACT(YEAR FROM date) = p_year;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function: Get monthly expenses for a user
CREATE OR REPLACE FUNCTION get_monthly_expenses(p_user_id UUID, p_month INTEGER, p_year INTEGER)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM expense_transactions
  WHERE user_id = p_user_id
    AND EXTRACT(MONTH FROM date) = p_month
    AND EXTRACT(YEAR FROM date) = p_year;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function: Get total assets for a user
CREATE OR REPLACE FUNCTION get_total_assets(p_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(current_value), 0)
  FROM assets
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function: Get total liabilities for a user
CREATE OR REPLACE FUNCTION get_total_liabilities(p_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(remaining_amount), 0)
  FROM liabilities
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function: Take net worth snapshot
CREATE OR REPLACE FUNCTION take_net_worth_snapshot(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_assets NUMERIC;
  v_liabilities NUMERIC;
  v_snapshot_id UUID;
BEGIN
  v_assets := get_total_assets(p_user_id);
  v_liabilities := get_total_liabilities(p_user_id);
  
  INSERT INTO net_worth_snapshots(user_id, total_assets, total_liabilities, net_worth, snapshot_date)
  VALUES (p_user_id, v_assets, v_liabilities, v_assets - v_liabilities, CURRENT_DATE)
  RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
