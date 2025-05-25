/*
  # 占い師カテゴリの再構築

  1. 変更内容
    - 既存のカテゴリをすべて削除
    - 4つのメインカテゴリを新規作成
    - 関連するテーブルのクリーンアップ

  2. セキュリティ
    - RLSポリシーは維持
    - 既存の権限設定を保持
*/

-- 既存のカテゴリをすべて削除
TRUNCATE fortune_categories CASCADE;

-- メインカテゴリの作成
INSERT INTO fortune_categories (name) VALUES
('占術'),
('スピリチュアル'),
('数秘・カード'),
('占星術');

-- インデックスの再作成
REINDEX TABLE fortune_categories;
REINDEX TABLE fortune_teller_categories;