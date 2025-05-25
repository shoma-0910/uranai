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
('恋愛・結婚・人間関係の悩み'),
('家族・家庭・子育ての悩み'),
('仕事・キャリアの悩み'),
('心と身体の悩み');

-- インデックスの再作成
REINDEX TABLE fortune_categories;
REINDEX TABLE fortune_teller_categories;