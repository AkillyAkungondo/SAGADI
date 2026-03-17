-- CreateTable
CREATE TABLE `perfis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `nivel_acesso` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `perfis_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilizadores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_completo` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha_hash` VARCHAR(191) NOT NULL,
    `perfil_id` INTEGER NOT NULL,
    `direcao_id` INTEGER NULL,
    `cargo` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `assinatura_digital` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `ultimo_acesso` DATETIME(3) NULL,
    `token_reset_senha` VARCHAR(191) NULL,
    `token_reset_expira` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `utilizadores_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direcoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `sigla` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `direcoes_sigla_key`(`sigla`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aerodromos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_oaci` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `provincia` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `direcao_id` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `aerodromos_codigo_oaci_key`(`codigo_oaci`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas_inspecao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `areas_inspecao_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `findings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_processo` VARCHAR(191) NOT NULL,
    `aerodromo_id` INTEGER NOT NULL,
    `area_inspecao_id` INTEGER NOT NULL,
    `inspetor_id` INTEGER NOT NULL,
    `data_inspecao` DATETIME(3) NOT NULL,
    `finding_level` INTEGER NOT NULL,
    `reference_document` TEXT NOT NULL,
    `finding_descricao` TEXT NOT NULL,
    `parte_1_concluida_em` DATETIME(3) NULL,
    `observacoes_operador` TEXT NULL,
    `root_causes` TEXT NULL,
    `acoes_corretivas` JSON NULL,
    `parte_2_concluida_em` DATETIME(3) NULL,
    `operador_resposta_id` INTEGER NULL,
    `comments_cap` TEXT NULL,
    `progress_documented` JSON NULL,
    `evaluation_actions` TEXT NULL,
    `data_aplicacao_acoes` DATETIME(3) NULL,
    `resolved_satisfactorily` BOOLEAN NULL,
    `inspector_assinatura_id` INTEGER NULL,
    `data_assinatura` DATETIME(3) NULL,
    `parte_3_concluida_em` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'rascunho',
    `prioridade` VARCHAR(191) NOT NULL DEFAULT 'media',
    `prazo_resposta_dias` INTEGER NOT NULL DEFAULT 15,
    `data_vencimento` DATETIME(3) NULL,
    `data_encerramento` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `findings_numero_processo_key`(`numero_processo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planos_acao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `finding_id` INTEGER NOT NULL,
    `descricao` TEXT NOT NULL,
    `office_action` VARCHAR(191) NULL,
    `evidence_ref` VARCHAR(191) NULL,
    `data_inicio` DATETIME(3) NULL,
    `data_vencimento` DATETIME(3) NULL,
    `progresso` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planos_acao_responsaveis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plano_acao_id` INTEGER NOT NULL,
    `utilizador_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `planos_acao_responsaveis_plano_acao_id_utilizador_id_key`(`plano_acao_id`, `utilizador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anexos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_original` VARCHAR(191) NOT NULL,
    `nome_arquivo` VARCHAR(191) NOT NULL,
    `caminho` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `uploaded_by` INTEGER NOT NULL,
    `finding_id` INTEGER NULL,
    `plano_acao_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `finding_id` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `destinatarios` JSON NOT NULL,
    `assunto` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `enviado_por` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `data_envio` DATETIME(3) NULL,
    `erro` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilizador_id` INTEGER NULL,
    `acao` VARCHAR(191) NOT NULL,
    `entidade` VARCHAR(191) NOT NULL,
    `entidade_id` INTEGER NULL,
    `dados_antes` JSON NULL,
    `dados_depois` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `findings_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `finding_id` INTEGER NOT NULL,
    `parte` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `dados_antes` JSON NULL,
    `dados_depois` JSON NULL,
    `editado_por_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `modulo` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissoes_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissoes_perfil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `perfil_id` INTEGER NOT NULL,
    `permissao_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissoes_perfil_perfil_id_permissao_id_key`(`perfil_id`, `permissao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `utilizadores` ADD CONSTRAINT `utilizadores_perfil_id_fkey` FOREIGN KEY (`perfil_id`) REFERENCES `perfis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilizadores` ADD CONSTRAINT `utilizadores_direcao_id_fkey` FOREIGN KEY (`direcao_id`) REFERENCES `direcoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aerodromos` ADD CONSTRAINT `aerodromos_direcao_id_fkey` FOREIGN KEY (`direcao_id`) REFERENCES `direcoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `findings` ADD CONSTRAINT `findings_aerodromo_id_fkey` FOREIGN KEY (`aerodromo_id`) REFERENCES `aerodromos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `findings` ADD CONSTRAINT `findings_area_inspecao_id_fkey` FOREIGN KEY (`area_inspecao_id`) REFERENCES `areas_inspecao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `findings` ADD CONSTRAINT `findings_inspetor_id_fkey` FOREIGN KEY (`inspetor_id`) REFERENCES `utilizadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `findings` ADD CONSTRAINT `findings_operador_resposta_id_fkey` FOREIGN KEY (`operador_resposta_id`) REFERENCES `utilizadores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `findings` ADD CONSTRAINT `findings_inspector_assinatura_id_fkey` FOREIGN KEY (`inspector_assinatura_id`) REFERENCES `utilizadores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_acao` ADD CONSTRAINT `planos_acao_finding_id_fkey` FOREIGN KEY (`finding_id`) REFERENCES `findings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_acao_responsaveis` ADD CONSTRAINT `planos_acao_responsaveis_plano_acao_id_fkey` FOREIGN KEY (`plano_acao_id`) REFERENCES `planos_acao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_acao_responsaveis` ADD CONSTRAINT `planos_acao_responsaveis_utilizador_id_fkey` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexos` ADD CONSTRAINT `anexos_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `utilizadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexos` ADD CONSTRAINT `anexos_finding_id_fkey` FOREIGN KEY (`finding_id`) REFERENCES `findings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexos` ADD CONSTRAINT `anexos_plano_acao_id_fkey` FOREIGN KEY (`plano_acao_id`) REFERENCES `planos_acao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_enviado_por_fkey` FOREIGN KEY (`enviado_por`) REFERENCES `utilizadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_finding_id_fkey` FOREIGN KEY (`finding_id`) REFERENCES `findings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria_logs` ADD CONSTRAINT `auditoria_logs_utilizador_id_fkey` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `findings_historico` ADD CONSTRAINT `findings_historico_finding_id_fkey` FOREIGN KEY (`finding_id`) REFERENCES `findings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `findings_historico` ADD CONSTRAINT `findings_historico_editado_por_id_fkey` FOREIGN KEY (`editado_por_id`) REFERENCES `utilizadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_perfil` ADD CONSTRAINT `permissoes_perfil_perfil_id_fkey` FOREIGN KEY (`perfil_id`) REFERENCES `perfis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_perfil` ADD CONSTRAINT `permissoes_perfil_permissao_id_fkey` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
