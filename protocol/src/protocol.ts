export enum MSAgentProtocolMessageType {
    // Client-to-server
    Join = "join",
    Talk = "talk",
    // Server-to-client
    Init = "init",
    AddUser = "adduser",
    RemoveUser = "remuser",
    Chat = "chat"
}

export interface MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType
}

// Client-to-server

export interface MSAgentJoinMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.Join,
    data: {
        username: string;
        agent: string;
    }
}

export interface MSAgentTalkMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.Talk,
    data: {
        msg: string;
    }
}

// Server-to-client

export interface MSAgentInitMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.Init,
    data: {
        username: string
        agent: string
        charlimit: number
        users: {
            username: string,
            agent: string
        }[]
    }
}

export interface MSAgentAddUserMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.AddUser,
    data: {
        username: string;
        agent: string;
    }
}

export interface MSAgentRemoveUserMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.RemoveUser,
    data: {
        username: string;
    }
}

export interface MSAgentChatMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.Chat,
    data: {
        username: string;
        message: string;
        audio? : string | undefined;
    }
}